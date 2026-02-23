import {
    createContext,
    createEffect,
    createMemo,
    createResource,
    useContext
} from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import { useAuth } from './AuthContext.jsx';
import {
    getCloudFile,
    getCloudFilesMetadata,
    removeCloudFile,
    storeCloudFile
} from '../db/cloudFile.js';
import { hashContent } from '../utils/hashContent.js';
import { resolveFileMode } from '../utils/fileMode.js';

const FilesContext = createContext();

function normalizeMetadata(file) {
    if (!file?.id) return null;

    const mode = resolveFileMode(file.name);

    return {
        id: file.id,
        name: file.name || 'Untitled.md',
        size: Number(file.size) || 0,
        createdAt: Number(file.createdAt) || Date.now(),
        updatedAt: Number(file.updatedAt) || Number(file.createdAt) || Date.now(),
        extension: file.extension || mode.extension,
        type: file.type || mode.type
    };
}

function mapToState(metadata) {
    const byId = {};
    const order = [];

    for (const file of metadata) {
        byId[file.id] = file;
        order.push(file.id);
    }

    return { byId, order };
}

export function FilesProvider(props) {
    const { user } = useAuth();
    const [state, setState] = createStore({ byId: {}, order: [] });

    const [metadata, { refetch }] = createResource(
        () => user()?.id || null,
        async (userId) => {
            if (!userId) return [];

            const files = await getCloudFilesMetadata();
            return files.map(normalizeMetadata).filter(Boolean);
        },
        { initialValue: [] }
    );

    createEffect(() => {
        const userId = user()?.id;

        if (!userId) {
            setState({ byId: {}, order: [] });
            return;
        }

        const next = metadata();
        if (!Array.isArray(next)) return;
        setState(mapToState(next));
    });

    const files = createMemo(() => {
        return state.order
            .map((id) => state.byId[id])
            .filter(Boolean);
    });

    const refresh = async () => {
        if (!user()?.id) {
            setState({ byId: {}, order: [] });
            return [];
        }

        const next = await refetch();
        return Array.isArray(next) ? next : files();
    };

    const getFile = async (id) => {
        return await getCloudFile(id);
    };

    const addFile = async ({ name, content }) => {
        if (!content?.trim()) {
            throw new Error('content is required');
        }

        const { id, size } = await hashContent(content);
        if (state.byId[id]) {
            return { id, alreadyExist: true };
        }

        const now = Date.now();
        const mode = resolveFileMode(name);
        const optimistic = normalizeMetadata({
            id,
            name,
            size,
            extension: mode.extension,
            type: mode.type,
            createdAt: now,
            updatedAt: now
        });

        if (!optimistic) {
            throw new Error('Unable to build optimistic file metadata');
        }

        const snapshot = {
            byId: { ...state.byId },
            order: [...state.order]
        };

        setState(produce((draft) => {
            draft.byId[id] = optimistic;
            if (!draft.order.includes(id)) {
                draft.order.unshift(id);
            }
        }));

        try {
            const result = await storeCloudFile({
                name,
                content
            });
            await refresh();
            return { id: result?.id || id, alreadyExist: Boolean(result?.alreadyExist) };
        } catch (error) {
            setState(snapshot);
            throw error;
        }
    };

    const removeFile = async (id) => {
        if (!id) return;

        const snapshot = {
            byId: { ...state.byId },
            order: [...state.order]
        };

        setState(produce((draft) => {
            delete draft.byId[id];
            draft.order = draft.order.filter((entryId) => entryId !== id);
        }));

        try {
            await removeCloudFile(id);
            return { id };
        } catch (error) {
            setState(snapshot);
            throw error;
        }
    };

    return (
        <FilesContext.Provider value={{
            files,
            isLoading: metadata.loading,
            error: metadata.error,
            refresh,
            getFile,
            addFile,
            removeFile
        }}>
            {props.children}
        </FilesContext.Provider>
    );
}

export function useFiles() {
    const context = useContext(FilesContext);
    if (!context) {
        throw new Error('useFiles must be used inside FilesProvider');
    }

    return context;
}
