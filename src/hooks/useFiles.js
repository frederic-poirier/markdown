import { createSignal, createEffect } from 'solid-js';

export function useFiles() {
  const [files, setFiles] = createSignal([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data.files || []);
      setError(null);
    } catch (err) {
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    fetchFiles();
  });

  const refreshFiles = fetchFiles;

  return { files, loading, error, refreshFiles };
}

export function useFileContent(filePathSignal) {
  const [ast, setAst] = createSignal(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal(null);

  const fetchContent = async (path) => {
    if (!path) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/markdown?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error('File not found');
      const data = await response.json();
      setAst(data.hast);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  createEffect(() => {
    const path = filePathSignal?.();
    if (path) {
      fetchContent(path);
    }
  });

  return { ast, loading, error, fetchContent };
}

export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = createSignal([]);

  createEffect(() => {
    const saved = localStorage.getItem('recentFiles');
    if (saved) {
      try {
        setRecentFiles(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent files:', e);
      }
    }
  });

  const addRecentFile = (filePath) => {
    setRecentFiles(prev => {
      const newRecent = [filePath, ...prev.filter(f => f !== filePath)].slice(0, 10);
      localStorage.setItem('recentFiles', JSON.stringify(newRecent));
      return newRecent;
    });
  };

  return { recentFiles, addRecentFile };
}

export function useWebSocket(onReload) {
  createEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'reload') {
        onReload?.(data.path);
      }
    };

    return () => ws.close();
  });
}
