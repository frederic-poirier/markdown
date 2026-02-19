import Check from 'lucide-solid/icons/check';
import { Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

export function List(props) {
  const component = props.ordered ? 'ol' : 'ul';
  const classes = props.ordered
    ? 'list-decimal my-3 space-y-1.5 pl-6'
    : 'list-disc my-3 space-y-1.5 pl-6 [&:has(.checkbox)]:list-none';

  return (
    <Dynamic component={component} class={classes}>
      {props.children}
    </Dynamic>
  );
}

export function ListItem(props) {
  return (
    <li class="text-neutral-600 relative">
      {props.children}
    </li>
  );
}

export function Checkbox(props) {
  return (
    <span
      aria-hidden="true"
      data-checked={props.checked ? 'true' : 'false'}
      classList={{
        'absolute left-[1.5em] top-[0.25lh]': props.position === undefined
      }}
      class="checkbox w-4 h-4 rounded bg-neutral-200 text-neutral-600 flex items-center justify-center"
    >
      <Show when={props.checked}>
        <Check size={14} stroke-width={3} />
      </Show>
    </span>
  );
}