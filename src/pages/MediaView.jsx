import { useParams } from '@solidjs/router';
import { createResource, Show } from 'solid-js';
import { useFiles } from '../context/FilesContext.jsx';

export default function MediaView() {
    const params = useParams();
    const { getFile } = useFiles();
    const [file] = createResource(() => params.id, getFile);

    return (
        <Show when={file()} fallback="No file imported">
            <section class="w-full max-w-none">
                <h1>{file().name}</h1>
                <div class="rounded-lg border border-neutral-200 bg-neutral-100 p-4 text-neutral-600">
                    Media mode is reserved for upcoming media renderers.
                </div>
            </section>
        </Show>
    );
}
