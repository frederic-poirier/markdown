import { Show, createSignal } from "solid-js";

export function ImageReference(props) {
    const [hasError, setHasError] = createSignal(false);
    const identifier = props.node?.identifier || '';
    const alt = props.node?.alt || '';
    const src = props.src || '';

    return (
        <figure class="my-8 w-fit">
            <Show
                when={!hasError() && src}
                fallback={imagePlaceholder()}
            >
                <img
                    src={src}
                    alt={alt}
                    onError={() => setHasError(true)}
                    class="max-w-full h-auto rounded-lg"
                    data-reference={identifier}
                />
            </Show>
            <Show when={alt}>
                <figcaption class="mt-2 text-neutral-600 dark:text-neutral-600 text-xs text-center">
                    {alt}
                </figcaption>
            </Show>
        </figure>
    );
}

function imagePlaceholder() {
    return (
        <div class="w-full h-full flex items-center justify-center text-neutral-600 dark:text-neutral-600 text-sm">
            Image non disponible
        </div>
    );
}
