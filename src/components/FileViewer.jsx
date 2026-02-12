import { Show } from 'solid-js';
import { MarkdownRenderer } from '../components/MarkdownRenderer.jsx';
import { ArrowLeftIcon } from '../components/Icons.jsx';
import { useFileContent, useWebSocket } from '../hooks/useFiles.js';
import { useParams, useNavigate } from '@solidjs/router';

export function FileViewer() {
  const params = useParams();
  const navigate = useNavigate();
  const filePath = () => decodeURIComponent(params.name);
  const { ast, loading, error, fetchContent } = useFileContent(filePath);

  // WebSocket for hot reload
  useWebSocket((reloadedPath) => {
    if (reloadedPath === filePath()) {
      fetchContent(filePath());
    }
  });

  return (
    <div class="min-h-full">
      <Show when={loading()}>
        <div class="flex items-center justify-center h-96">
          <div class="text-[#555] text-sm">Loading...</div>
        </div>
      </Show>

      <Show when={error()}>
        <div class="flex flex-col items-center justify-center h-96 gap-4">
          <div class="text-[#888] text-lg">Something went wrong</div>
          <div class="text-[#555] text-sm">{error()}</div>
          <button
            onClick={() => navigate('/')}
            class="text-[#666] hover:text-[#999] text-sm transition-colors flex items-center gap-1"
          >
            <ArrowLeftIcon size={14} />
            Back to files
          </button>
        </div>
      </Show>

      <Show when={!loading() && !error() && ast()}>
        <div class="max-w-3xl mx-auto px-8 py-12">
          {/* Breadcrumb */}
          <div class="flex items-center gap-2 text-sm mb-8 pb-4 border-b border-[#222]">
            <button
              onClick={() => navigate('/')}
              class="text-[#555] hover:text-[#888] transition-colors"
            >
              Files
            </button>
            <span class="text-[#333]">/</span>
            <span class="text-[#666] font-mono">{filePath()}</span>
          </div>

          <MarkdownRenderer ast={ast()} />
        </div>
      </Show>
    </div>
  );
}
