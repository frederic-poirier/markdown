import { Show, createResource, createSignal } from 'solid-js';
import { getBadgeData } from '../../utils/useBadge';

function Badge(props) {
  const [badgeData] = createResource(props.src, getBadgeData)

  return (
    <Show when={badgeData()} fallback="chargement">
      <span
        href={props.href}
        className='
        py-0.5 px-2 text-sm w-fit rounded-lg 
        bg-neutral-100 border border-neutral-200 [&_svg]:fill-neutral-500
        items-center inline-flex gap-2 capitalize'
      >
        <Show when={badgeData().logo}>
          <span
            className='*:w-3 *:h-3'
            innerHTML={badgeData().logo}
          />
        </Show>
        {badgeData().label} {badgeData().value}
      </span>
    </Show>
  );
}

function isBadge(source) {
  const shieldBadge = 'https://img.shields.io'
  const githubBadge = 'https://github.com'

  if (source.startsWith(shieldBadge)) return true
  if (source.startsWith(githubBadge)
    && source.endsWith('.svg')
    && source.includes("badge")
  ) return true
  return false
}


export function Image(props) {
  const [hasError, setHasError] = createSignal(false);

  return (
    <Show when={!isBadge(props.src)} fallback={Badge(props)}>
      <Show when={!hasError()} fallback={imagePlaceholder()}>
        <img
          src={props.src}
          alt={props.alt || ''}
          title={props.title}
          onError={() => setHasError(true)}
          class="max-w-full h-auto rounded-lg"
        />
      </Show>
    </Show>
  );
}

function imagePlaceholder() {
  return (
    <div class="w-full h-full flex items-center justify-center text-neutral-600 dark:text-neutral-600 text-sm">
      Image non disponible
    </div>
  )
}
