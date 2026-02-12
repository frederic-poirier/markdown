import { Show, onCleanup, onMount } from 'solid-js';
import { CloseIcon } from '../Icons.jsx';

export function Modal(props) {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && props.onClose) {
      props.onClose();
    }
  };

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
  });

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
    document.body.style.overflow = '';
  });

  return (
    <Show when={props.isOpen}>
      <div 
        class="fixed inset-0 z-50 flex items-center justify-center"
        onClick={(e) => e.target === e.currentTarget && props.onClose?.()}
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div class="relative z-10 bg-[#1a1a1a] border border-[#333] rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
          <Show when={props.title}>
            <div class="flex items-center justify-between px-6 py-4 border-b border-[#333]">
              <h2 class="text-lg font-medium text-[#e0e0e0]">{props.title}</h2>
              <button onClick={props.onClose} class="text-[#666] hover:text-[#999] transition-colors p-1">
                <CloseIcon size={20} />
              </button>
            </div>
          </Show>
          <div class="p-6 overflow-y-auto">
            {props.children}
          </div>
          <Show when={props.footer}>
            <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#333] bg-[#1a1a1a]/50">
              {props.footer}
            </div>
          </Show>
        </div>
      </div>
    </Show>
  );
}

export function Dropdown(props) {
  return (
    <Show when={props.isOpen}>
      <div class="relative">
        <div class="fixed inset-0 z-40" onClick={props.onClose} />
        <div class="absolute z-50 mt-2 w-56 rounded-lg bg-[#1a1a1a] border border-[#333] shadow-xl py-1">
          {props.children}
        </div>
      </div>
    </Show>
  );
}

export function DropdownItem(props) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#999] hover:bg-[#222] hover:text-[#ccc] transition-colors disabled:opacity-50"
    >
      {props.icon && <span class="text-[#666]">{props.icon}</span>}
      <span>{props.children}</span>
    </button>
  );
}

export function DropdownSeparator() {
  return <div class="my-1 border-t border-[#333]" />;
}
