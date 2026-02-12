import { createSignal } from "solid-js";

export function Image(props) {
  const [hasError, setHasError] = createSignal(false);
  return (
    <figure className="my-8 w-full">
      <div class="min-h-60 min-w-full bg-neutral-850 rounded-xl flex items-center justify-center">
        <Show
          when={!hasError()}
          fallback={imagePlaceholder()}
        >
          <img
            src={props.src}
            alt={props.alt || ''}
            onError={() => setHasError(true)}
            class="max-w-full h-auto rounded-lg"
          />
        </Show>
      </div>
      <Show when={props.alt}>
        <figcaption class="mt-2 text-neutral-500 text-xs text-center">
          {props.alt}
        </figcaption>
      </Show>
    </figure>
  );
}

function imagePlaceholder() {
  return (
    <div class="w-full h-full flex items-center justify-center text-neutral-500 text-sm">
      Image non disponible
    </div>
  )
}