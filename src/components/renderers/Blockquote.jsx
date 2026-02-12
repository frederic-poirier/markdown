export function Blockquote(props) {
  return (
    <blockquote class="border-l-2 border-neutral-800 pl-5 my-8 text-neutral-400 italic [&>p]:my-2">
      {props.children}
    </blockquote>
  );
}
