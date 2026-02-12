export function Blockquote(props) {
  return (
    <blockquote class="border-l-2 border-[#2a2a2a] pl-5 my-8 text-[#888] italic [&>p]:my-2">
      {props.children}
    </blockquote>
  );
}
