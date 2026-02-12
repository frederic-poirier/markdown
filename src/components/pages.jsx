import { Show, createSignal, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { MarkdownRenderer } from '../components/MarkdownRenderer.jsx';
import { ArrowLeftIcon } from '../components/Icons.jsx';

export function Home() {
  return (
    <div class="h-full flex flex-col items-center justify-center text-center px-8">
      <div class="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6">
        <span class="text-3xl">📝</span>
      </div>
      
      <h1 class="text-2xl font-semibold text-[#e0e0e0] mb-2">
        Welcome to Markdown Viewer
      </h1>
      
      <p class="text-[#666] max-w-md mb-8">
        Select a file from the sidebar to view it, or add a new markdown file by pasting content or uploading.
      </p>

      <div class="flex items-center gap-4 text-sm text-[#555]">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 bg-[#1a1a1a] rounded flex items-center justify-center text-xs">⌘</span>
          <span>+</span>
          <span class="w-6 h-6 bg-[#1a1a1a] rounded flex items-center justify-center text-xs">K</span>
          <span>to search</span>
        </div>
      </div>
    </div>
  );
}

export function Preview() {
  const navigate = useNavigate();
  const [ast, setAst] = createSignal(null);
  const [loading, setLoading] = createSignal(true);

  createEffect(() => {
    const saved = sessionStorage.getItem('pastedMarkdown');
    if (saved) {
      try {
        setAst(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved markdown:', e);
      }
    }
    setLoading(false);
  });

  const handleBack = () => {
    sessionStorage.removeItem('pastedMarkdown');
    navigate('/');
  };

  return (
    <div class="min-h-full">
      <Show when={loading()}>
        <div class="flex items-center justify-center h-96">
          <div class="text-[#555] text-sm">Loading...</div>
        </div>
      </Show>

      <Show when={!loading() && !ast()}>
        <div class="flex flex-col items-center justify-center h-96 gap-4">
          <div class="text-[#888] text-lg">No content to preview</div>
          <button
            onClick={() => navigate('/')}
            class="text-[#666] hover:text-[#999] text-sm transition-colors flex items-center gap-1"
          >
            <ArrowLeftIcon size={14} />
            Back to files
          </button>
        </div>
      </Show>

      <Show when={!loading() && ast()}>
        <div class="max-w-3xl mx-auto px-8 py-12">
          {/* Breadcrumb */}
          <div class="flex items-center gap-2 text-sm mb-8 pb-4 border-b border-[#222]">
            <button
              onClick={handleBack}
              class="text-[#555] hover:text-[#888] transition-colors flex items-center gap-1"
            >
              <ArrowLeftIcon size={14} />
              Back
            </button>
            <span class="text-[#333]">/</span>
            <span class="text-[#666]">pasted content</span>
          </div>

          <MarkdownRenderer ast={ast()} />
        </div>
      </Show>
    </div>
  );
}
