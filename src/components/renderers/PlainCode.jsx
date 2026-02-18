import { createSignal } from 'solid-js';

export function PlainCode(props) {
  const [copied, setCopied] = createSignal(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(props.children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div class="relative group">
      <button
        onClick={handleCopy}
        class="absolute right-0 top-0 px-2.5 py-1 text-[11px] bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-400 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150 font-mono tracking-wide z-10"
      >
        {copied() ? 'Copied' : 'Copy'}
      </button>
      <pre class="overflow-x-auto whitespace-pre font-mono text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        <code innerHTML={props.value || props.children} />
      </pre>
    </div>
  );
}
