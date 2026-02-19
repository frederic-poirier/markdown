import localforage from 'localforage';
import { hashContent } from '../utils/hashContent.js';
import { resolveFileMode } from '../utils/fileMode.js';


const store = localforage.createInstance({
  name: 'md',
  storeName: 'files'
});

const INDEX_KEY = '__files_index__';

async function getIndex() {
  return (await store.getItem(INDEX_KEY)) || [];
}

async function setIndex(index) {
  await store.setItem(INDEX_KEY, index);
}

export async function addFile(file) {
  const { id, size } = await hashContent(file.content);

  const alreadyExist = await getFile(id);
  if (alreadyExist) return { id, alreadyExist: true };

  const mode = resolveFileMode(file.name);
  const entry = {
    id,
    name: file.name,
    content: file.content,
    sourceFormat: file.sourceFormat || mode.sourceFormat,
    renderMode: file.renderMode || mode.renderMode,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await store.setItem(id, entry);
  const index = await getIndex();
  index.push({
    id,
    name: file.name,
    size,
    sourceFormat: entry.sourceFormat,
    renderMode: entry.renderMode,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  });
  await setIndex(index);

  return { id, alreadyExist: false };
}

export async function getFile(id) {
  return await store.getItem(id);
}

export async function removeFile(id) {
  await store.removeItem(id);

  const index = await getIndex();
  const updated = index.filter((file) => file.id !== id);
  await setIndex(updated);
}

export async function getFilesMetadata() {
  return await getIndex();
}

export async function updateFile(id, patch) {
  const current = await getFile(id);
  if (!current) {
    throw new Error('File not found');
  }

  const nextName = typeof patch?.name === 'string' && patch.name.trim()
    ? patch.name.trim()
    : current.name;
  const nextContent = typeof patch?.content === 'string'
    ? patch.content
    : current.content;

  if (typeof nextContent !== 'string' || nextContent.trim().length === 0) {
    throw new Error('content is required');
  }

  const mode = resolveFileMode(nextName);
  const now = Date.now();
  const { id: nextId, size } = await hashContent(nextContent);
  const nextEntry = {
    id: nextId,
    name: nextName,
    content: nextContent,
    sourceFormat: patch?.sourceFormat || current.sourceFormat || mode.sourceFormat,
    renderMode: patch?.renderMode || current.renderMode || mode.renderMode,
    createdAt: current.createdAt,
    updatedAt: now
  };

  const index = await getIndex();
  const currentIndex = index.find((entry) => entry.id === id);

  if (id !== nextId) {
    const duplicate = await getFile(nextId);
    if (duplicate) {
      return { id, nextId, alreadyExist: true, file: duplicate };
    }

    await store.removeItem(id);
  }

  await store.setItem(nextId, nextEntry);

  const nextIndex = index
    .filter((entry) => entry.id !== id)
    .concat({
      id: nextId,
      name: nextName,
      size,
      sourceFormat: nextEntry.sourceFormat,
      renderMode: nextEntry.renderMode,
      createdAt: currentIndex?.createdAt || current.createdAt,
      updatedAt: now
    });

  await setIndex(nextIndex);

  return { id, nextId, alreadyExist: false, file: nextEntry };
}
