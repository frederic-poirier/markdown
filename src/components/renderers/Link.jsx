export function Link(props) {
  const isExternal = props.href?.startsWith('http');

  return (
    <a
      href={props.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      class="text-neutral-600 underline decoration-neutral-600 underline-offset-[3px] focus:text-neutral-600 hover:text-neutral-600 transition-colors [&:has(.badge-text)]:no-underline"
    >
      {props.children}
    </a>
  );
}