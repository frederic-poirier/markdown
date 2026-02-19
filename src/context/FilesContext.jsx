import { createContext, createEffect, onMount, useContext } from 'solid-js';
import { useAuth } from './AuthContext.jsx';
import { createFilesStore } from '../utils/useFilesStore.js';

const FilesContext = createContext();

export function FilesProvider(props) {
    const { user } = useAuth();
    const store = createFilesStore(() => user()?.id || null);

    onMount(() => {
        store.refreshLocal();
        store.refreshCloud();
    });

    createEffect(() => {
        const userId = user()?.id || null;
        if (userId) {
            store.refreshCloud();
            return;
        }

        store.refreshCloud();
    });

    return (
        <FilesContext.Provider value={store}>
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
