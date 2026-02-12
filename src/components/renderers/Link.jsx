export function Link(props) {
  const isExternal = props.href?.startsWith('http');
  
  return (
    <a
      href={props.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      class="text-neutral-400 underline decoration-neutral-600 underline-offset-[3px] hover:text-neutral-200 hover:decoration-neutral-500 transition-colors"
    >
      {props.children}
    </a>
  );
}
