export function Paragraph(props) {
    return (
        <p class="my-2 break-normal text-neutral-600 leading-[1.85] text-[0.9375rem]">
            {props.children}
        </p>
    );
}
