export function Link(props) {
  const isExternal = props.href?.startsWith('http');
  
  return (
    <a
      href={props.href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      class="text-[#bbb] underline decoration-[#444] underline-offset-[3px] hover:text-[#e0e0e0] hover:decoration-[#666] transition-colors"
    >
      {props.children}
    </a>
  );
}
