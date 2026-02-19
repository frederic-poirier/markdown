import { createResource, Show } from "solid-js";

let mermaidPromise;
let initialized = false;

async function getMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(m => m.default);
  }
  const mermaid = await mermaidPromise;
  if (!initialized) {
    mermaid.initialize({ startOnLoad: false, suppressErrorRendering: true });
    initialized = true;
  }
  return mermaid;
}

async function renderMermaid(source) {
  if (!source?.trim()) return { svg: null, error: 'Empty diagram' };
  try {
    const mermaid = await getMermaid();
    const valid = await mermaid.parse(source, { suppressErrors: true });
    if (!valid) return { svg: null, error: 'Syntax error' };
    const id = `mermaid-${crypto.randomUUID()}`;
    const { svg } = await mermaid.render(id, source);
    return { svg, error: null };
  } catch (error) {
    return { svg: null, error: error.message ?? 'Render error' };
  }
}

export function MermaidBlock(props) {
  const [result] = createResource(() => props.value, renderMermaid);

  return (
    <Show
      when={result()}
      fallback={<div class="my-6 rounded-lg border border-neutral-200 bg-neutral-100 p-4 text-sm">Loading...</div>}
    >
      <Show
        when={result().svg}
        fallback={
          <div class="my-6 rounded-lg border border-neutral-200 bg-neutral-100 p-4 text-sm text-neutral-600">
            {result().error}
          </div>
        }
      >
        <div class="my-6 rounded-lg border border-neutral-200 bg-neutral-100 p-4 overflow-auto">
          <div innerHTML={result().svg} />
        </div>
      </Show>
    </Show>
  );
}
