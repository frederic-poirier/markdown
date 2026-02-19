import { createMemo, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import {
  addFile,
  getFile as getLocalFile,
  getFilesMetadata,
  removeFile as removeLocalFile,
  updateFile as updateLocalFile
} from '../db/file.js';
import {
  getCloudFile,
  getCloudFilesMetadata,
  removeCloudFile,
  storeCloudFile
} from '../db/cloudFile.js';
import { hashContent } from './hashContent.js';
import { resolveFileMode } from './fileMode.js';

function normalizeMetadata(file) {
  if (!file?.id) return null;

  const mode = resolveFileMode(file.name);

  return {
    id: file.id,
    name: file.name || 'Untitled.md',
    size: Number(file.size) || 0,
    createdAt: Number(file.createdAt) || Date.now(),
    updatedAt: Number(file.updatedAt) || Number(file.createdAt) || Date.now(),
    sourceFormat: file.sourceFormat || mode.sourceFormat,
    renderMode: file.renderMode || mode.renderMode,
    extension: file.extension || mode.extension
  };
}

function asIdMap(files) {
  return files.reduce((map, file) => {
    map[file.id] = file;
    return map;
  }, {});
}

function applyLocalSnapshot(setState, snapshot) {
  setState('localOrder', snapshot.localOrder);
  setState('localById', snapshot.localById);
}

function applyCloudSnapshot(setState, snapshot) {
  setState('cloudOrder', snapshot.cloudOrder);
  setState('cloudById', snapshot.cloudById);
}

export function createFilesStore(userIdAccessor) {
  const [state, setState] = createStore({
    localById: {},
    localOrder: [],
    cloudById: {},
    cloudOrder: [],
    pendingById: {}
  });
  const [loadingLocal, setLoadingLocal] = createSignal(false);
  const [loadingCloud, setLoadingCloud] = createSignal(false);

  const localFiles = createMemo(() => state.localOrder
    .map((id) => state.localById[id])
    .filter(Boolean));
  const cloudFiles = createMemo(() => state.cloudOrder
    .map((id) => state.cloudById[id])
    .filter(Boolean));
  const cloudIds = createMemo(() => new Set(state.cloudOrder));

  const updatePending = (id, isPending) => {
    if (!id) return;
    setState('pendingById', id, isPending);
  };

  const refreshLocal = async () => {
    setLoadingLocal(true);

    try {
      const metadata = await getFilesMetadata();
      const normalized = metadata
        .map(normalizeMetadata)
        .filter(Boolean);

      setState('localById', asIdMap(normalized));
      setState('localOrder', normalized.map((file) => file.id));
      return normalized;
    } finally {
      setLoadingLocal(false);
    }
  };

  const refreshCloud = async () => {
    const userId = userIdAccessor?.();
    if (!userId) {
      setState('cloudById', {});
      setState('cloudOrder', []);
      return [];
    }

    setLoadingCloud(true);

    try {
      const metadata = await getCloudFilesMetadata();
      const normalized = metadata
        .map(normalizeMetadata)
        .filter(Boolean);

      setState('cloudById', asIdMap(normalized));
      setState('cloudOrder', normalized.map((file) => file.id));
      return normalized;
    } finally {
      setLoadingCloud(false);
    }
  };

  const addFileOptimistic = async ({ name, content, sourceFormat, renderMode }) => {
    if (!content?.trim()) {
      throw new Error('content is required');
    }

    const { id, size } = await hashContent(content);

    if (state.localById[id]) {
      return { id, alreadyExist: true };
    }

    const now = Date.now();
    const optimistic = normalizeMetadata({
      id,
      name,
      size,
      sourceFormat,
      renderMode,
      createdAt: now,
      updatedAt: now
    });

    setState('localById', id, optimistic);
    setState('localOrder', (prev) => [...prev, id]);
    updatePending(id, true);

    try {
      const result = await addFile({
        name: optimistic.name,
        content,
        sourceFormat: optimistic.sourceFormat,
        renderMode: optimistic.renderMode
      });
      await refreshLocal();
      return { id: result.id, alreadyExist: Boolean(result.alreadyExist) };
    } catch (error) {
      setState('localOrder', (prev) => prev.filter((entryId) => entryId !== id));
      setState('localById', id, undefined);
      throw error;
    } finally {
      updatePending(id, false);
    }
  };

  const removeLocalOptimistic = async (id) => {
    if (!id) return;

    const snapshot = {
      localById: { ...state.localById },
      localOrder: [...state.localOrder]
    };

    setState('localOrder', (prev) => prev.filter((entryId) => entryId !== id));
    setState('localById', id, undefined);
    updatePending(id, true);

    try {
      await removeLocalFile(id);
      return { id };
    } catch (error) {
      applyLocalSnapshot(setState, snapshot);
      throw error;
    } finally {
      updatePending(id, false);
    }
  };

  const setCloudSyncOptimistic = async (id, enabled) => {
    if (!id) return;

    const cloudSnapshot = {
      cloudById: { ...state.cloudById },
      cloudOrder: [...state.cloudOrder]
    };

    if (enabled) {
      const localFile = state.localById[id] || await getLocalFile(id);
      if (!localFile) {
        throw new Error('Local file not found');
      }

      const optimistic = normalizeMetadata(localFile);
      setState('cloudById', id, optimistic);
      setState('cloudOrder', (prev) => prev.includes(id) ? prev : [...prev, id]);

      updatePending(id, true);
      try {
        await storeCloudFile(localFile);
        await refreshCloud();
        return { id, synced: true };
      } catch (error) {
        applyCloudSnapshot(setState, cloudSnapshot);
        throw error;
      } finally {
        updatePending(id, false);
      }
    }

    setState('cloudOrder', (prev) => prev.filter((entryId) => entryId !== id));
    setState('cloudById', id, undefined);

    updatePending(id, true);
    try {
      await removeCloudFile(id);
      await refreshCloud();
      return { id, synced: false };
    } catch (error) {
      applyCloudSnapshot(setState, cloudSnapshot);
      throw error;
    } finally {
      updatePending(id, false);
    }
  };

  const updateFileOptimistic = async (id, patch) => {
    if (!id) {
      throw new Error('id is required');
    }

    const localSnapshot = {
      localById: { ...state.localById },
      localOrder: [...state.localOrder]
    };
    const cloudSnapshot = {
      cloudById: { ...state.cloudById },
      cloudOrder: [...state.cloudOrder]
    };

    const source = state.localById[id] || await getLocalFile(id);
    if (!source) {
      throw new Error('Local file not found');
    }

    const nextName = typeof patch?.name === 'string' && patch.name.trim()
      ? patch.name.trim()
      : source.name;
    const nextContent = typeof patch?.content === 'string'
      ? patch.content
      : source.content;

    const { id: nextId, size } = await hashContent(nextContent);
    const nextMeta = normalizeMetadata({
      id: nextId,
      name: nextName,
      size,
      createdAt: source.createdAt,
      updatedAt: Date.now()
    });

    if (nextId !== id) {
      setState('localOrder', (prev) => prev
        .filter((entryId) => entryId !== id)
        .concat(nextId));
      setState('localById', id, undefined);
    }
    setState('localById', nextId, nextMeta);

    const wasSynced = Boolean(state.cloudById[id]);
    if (wasSynced) {
      if (nextId !== id) {
        setState('cloudOrder', (prev) => prev
          .filter((entryId) => entryId !== id)
          .concat(nextId));
        setState('cloudById', id, undefined);
      }
      setState('cloudById', nextId, nextMeta);
    }

    updatePending(id, true);
    if (nextId !== id) {
      updatePending(nextId, true);
    }

    try {
      const result = await updateLocalFile(id, { name: nextName, content: nextContent });

      if (result.alreadyExist) {
        throw new Error('A file with the same content already exists');
      }

      if (wasSynced) {
        await storeCloudFile(result.file);
        if (result.nextId !== id) {
          await removeCloudFile(id);
        }
      }

      await refreshLocal();
      if (wasSynced) {
        await refreshCloud();
      }

      return { id, nextId: result.nextId };
    } catch (error) {
      applyLocalSnapshot(setState, localSnapshot);
      applyCloudSnapshot(setState, cloudSnapshot);
      throw error;
    } finally {
      updatePending(id, false);
      if (nextId !== id) {
        updatePending(nextId, false);
      }
    }
  };

  const getFileFromAnyStorage = async (id) => {
    const local = await getLocalFile(id);
    if (local) return local;

    return await getCloudFile(id);
  };

  return {
    localFiles,
    cloudFiles,
    cloudIds,
    isPending: (id) => Boolean(state.pendingById[id]),
    isLoadingLocal: loadingLocal,
    isLoadingCloud: loadingCloud,
    refreshLocal,
    refreshCloud,
    addFileOptimistic,
    removeLocalOptimistic,
    setCloudSyncOptimistic,
    updateFileOptimistic,
    getFileFromAnyStorage
  };
}
