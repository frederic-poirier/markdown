export function Image(props) {
  return (
    <figure class="my-8 min-h-40 min-w-full bg-neutral-900 rounded-xl">
      <img
        src={props.src}
        alt={props.alt || ''}
        class="max-w-full h-auto rounded-lg"
      />
      {props.alt && (
        <figcaption class="text-[#555] text-xs mt-3 text-center">
          {props.alt}
        </figcaption>
      )}
    </figure>
  );
}
