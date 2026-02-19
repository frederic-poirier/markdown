import { useParams } from '@solidjs/router';
import { createEffect, createResource, onCleanup, Show } from 'solid-js';
import { CodeBlock } from '../components/renderers/CodeBlock.jsx';
import { useFiles } from '../context/FilesContext.jsx';
import { getCodeLanguage } from '../utils/fileMode.js';

const DEFAULT_TITLE = 'Code';

function ensureDescriptionMeta() {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
    }

    return meta;
}

export default function CodeView() {
    const params = useParams();
    const { getFileFromAnyStorage } = useFiles();
    const [file] = createResource(() => params.id, getFileFromAnyStorage);

    createEffect(() => {
        const filename = file()?.name?.trim();
        const title = filename || DEFAULT_TITLE;
        document.title = title;

        const description = filename
            ? `Code - ${filename}`
            : DEFAULT_TITLE;

        const descriptionMeta = ensureDescriptionMeta();
        descriptionMeta.setAttribute('content', description);
    });

    onCleanup(() => {
        document.title = DEFAULT_TITLE;
        const descriptionMeta = ensureDescriptionMeta();
        descriptionMeta.setAttribute('content', DEFAULT_TITLE);
    });

    return (
        <Show when={file()} fallback="No file imported">
            <section class="w-full">
                <header class="mb-4 flex items-center justify-between gap-4">
                    <h1 class="m-0 text-lg font-medium break-all">{file().name}</h1>
                    <span class="text-sm text-neutral-600 uppercase">
                        {getCodeLanguage(file().name)}
                    </span>
                </header>
                <CodeBlock
                    language={getCodeLanguage(file().name)}
                    value={file().content || ''}
                    unstyled={true}
                />
            </section>
        </Show>
    );
}
