import { createSignal, createEffect, For, Show, onMount } from 'solid-js';
import { useNavigate, useParams, A } from '@solidjs/router';
import { AddNewButton } from './AddNewButton.jsx';
import { FileIcon, SearchIcon, ClockIcon } from './Icons.jsx';
import { useFiles, useRecentFiles } from '../hooks/useFiles.js';

export function Layout(props) {
  let mainREF

  onMount(() => mainREF?.scrollIntoView())
  return (
    <div class="layout-container hide-scrollbar h-screen max-w-dvw overflow-x-scroll snap-x snap-mandatory flex">
      <nav class="w-64 shrink-0 snap-start xl:absolute xl:inset-0">
        <SidebarContent />
      </nav>

      <main ref={mainREF} class="overflow-y-auto min-w-dvw snap-start">
        {props.children}
      </main>
    </div>
  );
}


function SidebarContent(props) {
  const navigate = useNavigate();
  const params = useParams();
  const currentFile = () => params.name ? decodeURIComponent(params.name) : null;

  const { files, loading, error, refreshFiles } = useFiles();
  const { recentFiles, addRecentFile } = useRecentFiles();
  const [searchQuery, setSearchQuery] = createSignal('');

  createEffect(() => {
    if (currentFile()) {
      addRecentFile(currentFile());
    }
  });

  const filteredFiles = () => {
    const query = searchQuery().toLowerCase();
    if (!query) return files();
    return files().filter(f => f.toLowerCase().includes(query));
  };

  const handleFileClick = (filePath) => {
    navigate(`/${encodeURIComponent(filePath)}`);
  };

  const formatFileName = (name) => {
    return name.replace('.md', '').replace(/[-_]/g, ' ');
  }

  return (
    <div class="px-3 *:not-first:px-2 pb-4 pt-10 space-y-6 h-screen flex flex-col">
      <label class="flex items-center gap-2 px-2 bg-neutral-850 rounded-xl">
        <SearchIcon size={14} class="text-neutral-700" />
        <input
          type="text"
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
          placeholder="Search files..."
          class="w-full py-2 focus:outline-none placeholder:text-neutral-500"
        />
      </label>
      <Show when={recentFiles().length > 0 && !searchQuery()}>
        <div>
          <h3 class="text-xs font-medium text-[#555] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ClockIcon size={12} />
            Recent
          </h3>
          <div class="space-y-0.5">
            <For each={recentFiles().slice(0, 5)}>
              {(file) => (
                <A
                  href={`/${encodeURIComponent(file)}`}
                  inactiveClass="text-[#666] hover:text-[#999] hover:bg-[#1a1a1a]"
                  class="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors truncate"
                >
                  <FileIcon size={14} />
                  <span class="truncate">{formatFileName(file)}</span>
                </A>
              )}
            </For>
          </div>
        </div>
      </Show>

      <div class="flex-1 overflow-y-auto">
        <Show when={!searchQuery()}>
          <h3 class="text-xs font-medium text-[#555] uppercase tracking-wider mb-2">
            Files
          </h3>
        </Show>

        <div class="space-y-0.5">
          <For each={filteredFiles()}>
            {(file) => (
              <A
                href={`/${encodeURIComponent(file)}`}
                inactiveClass="text-[#666] hover:text-[#999] hover:bg-[#1a1a1a]"
                class="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors truncate"
              >
                <FileIcon size={14} />
                <span class="truncate">{formatFileName(file)}</span>
              </A>
            )}
          </For>
        </div>

        <Show when={filteredFiles().length === 0}>
          <p class="text-sm text-[#444] text-center py-4">
            {searchQuery() ? 'No files found' : 'No markdown files'}
          </p>
        </Show>
      </div>
      <div className='mt-full'>
        <AddNewButton onUpload={refreshFiles} />
      </div>

    </div>
  )
}
