import { createResource } from 'solid-js';

const shikiPromise = import('shiki').then(m => m.codeToHtml);

async function highlight(code, lang) {
  try {
    const codeToHtml = await shikiPromise;
    return await codeToHtml(code, {
      lang,
      themes: { light: "github-light", dark: "github-dark" }
    });
  } catch {
    return null
  }
}

export function ShikiBlock(props) {
  const language = () => props.language;
  const value = () => props.value;

  const [html] = createResource(
    () => ({ code: value(), lang: language() }),
    ({ code, lang }) => highlight(code, lang)
  )

  return (
    <div class="my-6 rounded-lg border border-neutral-200 bg-neutral-100 overflow-x-auto">
      <Show
        when={html()}
        fallback={
          <pre class="p-4 m-0">
            <code class="text-sm font-mono text-neutral-600">{value()}</code>
          </pre>
        }
      >
        <code class="block text-sm font-mono" innerHTML={html()} />
      </Show>
    </div>
  );
}
