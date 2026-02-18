export function Definition(props) {
    const identifier = props.node?.identifier || '';
    const url = props.node?.url || '';
    const title = props.node?.title;
    const label = props.node?.label || identifier;

    return (
        <dl class="my-4 text-sm border-l-2 border-neutral-300 dark:border-neutral-700 pl-3">
            <dt class="font-semibold text-neutral-600 dark:text-neutral-600">{label}</dt>
            <dd class="text-neutral-600 dark:text-neutral-600">
                <a href={url} class="underline hover:text-neutral-600 dark:hover:text-neutral-600" title={title}>
                    {url}
                </a>
                {title && <span class="ml-2 text-neutral-600">({title})</span>}
            </dd>
        </dl>
    );
}
