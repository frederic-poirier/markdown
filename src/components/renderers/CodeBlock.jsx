import { createSignal, children as resolveChildren } from 'solid-js';

export function CodeBlock(props) {
  const [copied, setCopied] = createSignal(false);
  const resolved = resolveChildren(() => props.children);
  
  const handleCopy = () => {
    const element = resolved();
    let text = '';
    
    if (Array.isArray(element)) {
      element.forEach(child => {
        if (typeof child === 'string') {
          text += child;
        } else if (child?.textContent) {
          text += child.textContent;
        }
      });
    } else if (typeof element === 'string') {
      text = element;
    } else if (element?.textContent) {
      text = element.textContent;
    }
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  return (
    <div class="relative group mt-2 mb-4">
      <button
        onClick={handleCopy}
        class="absolute right-3 top-3 px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-500 hover:text-neutral-400 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150 font-mono tracking-wide z-10"
      >
        {copied() ? 'Copied' : 'Copy'}
      </button>
      <pre class="bg-neutral-850 p-5 rounded-lg overflow-x-auto border border-neutral-800">
        {props.children}
      </pre>
    </div>
  );
}
