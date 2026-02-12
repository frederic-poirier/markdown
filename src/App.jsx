import { createSignal, createEffect, onCleanup, Show, For, Switch, Match } from 'solid-js';
import { Layout } from './components/Layout';
import { MarkdownRenderer } from './components/MarkdownRenderer';

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function PasteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}

export default function App() {
  const [ast, setAst] = createSignal(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal(null);
  const [filePath, setFilePath] = createSignal('');
  const [files, setFiles] = createSignal([]);
  const [view, setView] = createSignal('home'); // home | paste | preview | file
  const [pasteText, setPasteText] = createSignal('');
  const [uploading, setUploading] = createSignal(false);

  let fileInputRef;

  createEffect(() => {
    const path = window.location.pathname.slice(1);
    if (path === 'paste') {
      setView('paste');
      setLoading(false);
    } else if (path && path.endsWith('.md')) {
      setFilePath(path);
      setView('file');
      fetchMarkdown(path);
    } else {
      setView('home');
      fetchFileList();
    }
  });

  async function fetchFileList() {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data.files || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch file list');
      setLoading(false);
    }
  }

  async function fetchMarkdown(path) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/markdown?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error('File not found');
      const data = await response.json();
      setAst(data.hast);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handlePreview() {
    const text = pasteText();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: text })
      });
      if (!response.ok) throw new Error('Preview failed');
      const data = await response.json();
      setAst(data.hast);
      setView('preview');
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();

      // Navigate to the uploaded file
      window.location.href = `/${data.path}`;
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  }

  // WebSocket for hot reload
  createEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'reload') {
        const currentPath = filePath();
        if (data.path === currentPath) {
          fetchMarkdown(currentPath);
        }
      }
    };

    onCleanup(() => ws.close());
  });

  function formatFileName(name) {
    return name.replace('.md', '').replace(/[-_]/g, ' ');
  }

  return (
    <Switch>
      {/* Loading */}
      <Match when={loading()}>
        <div class="min-h-screen bg-[#111] flex items-center justify-center">
          <div class="text-[#555] text-sm tracking-wide">Loading...</div>
        </div>
      </Match>

      {/* Error */}
      <Match when={error()}>
        <div class="min-h-screen bg-[#111] flex flex-col items-center justify-center gap-6">
          <div class="text-[#888] text-lg font-light">Something went wrong</div>
          <div class="text-[#555] text-sm">{error()}</div>
          <a href="/" class="text-[#666] hover:text-[#999] text-sm transition-colors">
            Back to files
          </a>
        </div>
      </Match>

      {/* Paste View */}
      <Match when={view() === 'paste'}>
        <div class="min-h-screen bg-[#111]">
          <div class="max-w-2xl mx-auto px-6 pt-16 pb-20">
            <div class="mb-10 flex items-center gap-3">
              <a
                href="/"
                class="text-[#555] hover:text-[#888] transition-colors flex items-center gap-1.5 text-sm"
              >
                <ArrowLeft />
                <span>Back</span>
              </a>
            </div>

            <h1 class="text-xl font-medium text-[#e0e0e0] tracking-tight mb-6">
              Paste Markdown
            </h1>

            <textarea
              value={pasteText()}
              onInput={(e) => setPasteText(e.currentTarget.value)}
              placeholder="Paste your markdown here..."
              class="w-full h-64 bg-[#161616] text-[#ccc] text-sm font-mono leading-relaxed p-4 rounded-lg border border-[#222] focus:border-[#333] focus:outline-none resize-y placeholder:text-[#444]"
              spellcheck={false}
            />

            <button
              onClick={handlePreview}
              disabled={!pasteText().trim()}
              class="mt-4 px-5 py-2.5 bg-[#222] text-[#ccc] text-sm font-medium rounded-lg hover:bg-[#2a2a2a] hover:text-[#e0e0e0] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Preview
            </button>
          </div>
        </div>
      </Match>

      {/* Preview (from paste) */}
      <Match when={view() === 'preview' && ast()}>
        <Layout>
          <div class="mb-10 flex items-center gap-3">
            <a
              href="/paste"
              class="text-[#555] hover:text-[#888] transition-colors flex items-center gap-1.5 text-sm"
            >
              <ArrowLeft />
              <span>Back to editor</span>
            </a>
            <span class="text-[#333]">/</span>
            <span class="text-[#555] text-sm">pasted content</span>
          </div>
          <MarkdownRenderer ast={ast()} />
        </Layout>
      </Match>

      {/* Home - File Picker */}
      <Match when={view() === 'home'}>
        <div class="min-h-screen bg-[#111]">
          <div class="max-w-2xl mx-auto px-6 pt-32 pb-20">
            {/* Header */}
            <div class="mb-12">
              <h1 class="text-2xl font-medium text-[#e0e0e0] tracking-tight mb-2">
                Markdown
              </h1>
              <p class="text-sm text-[#555]">
                {files().length} {files().length === 1 ? 'file' : 'files'}
              </p>
            </div>

            {/* Actions */}
            <div class="flex gap-2 mb-10">
              <a
                href="/paste"
                class="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-[#999] text-sm rounded-lg hover:bg-[#222] hover:text-[#ccc] transition-colors border border-[#222]"
              >
                <PasteIcon />
                <span>Paste</span>
              </a>
              <button
                onClick={() => fileInputRef?.click()}
                disabled={uploading()}
                class="flex items-center gap-2 px-4 py-2.5 bg-[#1a1a1a] text-[#999] text-sm rounded-lg hover:bg-[#222] hover:text-[#ccc] transition-colors border border-[#222] disabled:opacity-50"
              >
                <UploadIcon />
                <span>{uploading() ? 'Uploading...' : 'Upload'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.txt,text/markdown,text/plain"
                onChange={handleUpload}
                class="hidden"
              />
            </div>

            {/* File Cards */}
            <div class="space-y-1">
              <For each={files()} fallback={
                <p class="text-[#444] text-sm">No markdown files found.</p>
              }>
                {(file) => (
                  <a
                    href={`/${file}`}
                    class="group flex items-center gap-4 px-4 py-3.5 -mx-4 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div class="text-[#444] group-hover:text-[#666] transition-colors">
                      <FileIcon />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-[#ccc] group-hover:text-[#e0e0e0] text-sm font-medium truncate transition-colors">
                        {formatFileName(file)}
                      </div>
                      <div class="text-[#444] text-xs mt-0.5 font-mono">
                        {file}
                      </div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-[#333] group-hover:text-[#555] transition-colors">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </a>
                )}
              </For>
            </div>
          </div>
        </div>
      </Match>

      {/* Markdown View (from file) */}
      <Match when={view() === 'file' && ast()}>
        <Layout>
          <div class="mb-10 flex items-center gap-3">
            <a
              href="/"
              class="text-[#555] hover:text-[#888] transition-colors flex items-center gap-1.5 text-sm"
            >
              <ArrowLeft />
              <span>Back</span>
            </a>
            <span class="text-[#333]">/</span>
            <span class="text-[#555] text-sm font-mono">{filePath()}</span>
          </div>
          <MarkdownRenderer ast={ast()} />
        </Layout>
      </Match>
    </Switch>
  );
}
