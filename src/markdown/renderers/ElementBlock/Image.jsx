import { Match, Show, Switch, createSignal } from 'solid-js';
import { Badge } from './Badge.jsx';

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
    <Switch>
      <Match when={isBadge(props.src)}>
        <Badge {...props} />
      </Match>
      <Match when={true}>
        <Show when={!hasError()} fallback={imagePlaceholder()}>
          <img
            src={props.src}
            alt={props.alt || ''}
            title={props.title}
            onError={() => setHasError(true)}
            class="max-w-full h-auto rounded-lg"
          />
        </Show>
      </Match>
    </Switch>
  );
}

function imagePlaceholder() {
  return (
    <div class="w-full h-full flex items-center justify-center text-neutral-600 dark:text-neutral-600 text-sm">
      Image non disponible
    </div>
  )
}
