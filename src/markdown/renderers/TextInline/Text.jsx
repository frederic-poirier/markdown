export function Strong(props) {
  return <strong class="font-semibold">{props.children}</strong>
}

export function Em(props) {
  return <em class="italic">{props.children}</em>
}

export function Del(props) {
  return <del class="line-through text-subtle">{props.children}</del>
}

export function Code(props) {
  return <code class="font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-sm border border-neutral-200">{props.children}</code>
}

export function Hr() {
  return <hr class="my-6 border-0 h-px bg-neutral-100" />
}
