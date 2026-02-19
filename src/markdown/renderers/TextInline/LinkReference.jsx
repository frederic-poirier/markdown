export function LinkReference(props) {
    const identifier = props.node?.identifier || '';
    const referenceType = props.node?.referenceType || 'shortcut';
    const isExternal = props.href?.startsWith('http');

    return (
        <a
            href={props.href || `#${identifier}`}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            class="text-neutral-600 dark:text-neutral-600 underline decoration-neutral-600 dark:decoration-neutral-600 underline-offset-[3px] hover:text-neutral-600 hover:decoration-neutral-600 dark:hover:text-neutral-600 dark:hover:decoration-neutral-600 transition-colors"
            data-reference-type={referenceType}
        >
            {props.children}
        </a>
    );
}
