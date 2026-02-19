import { useParams } from '@solidjs/router';
import { createEffect, createResource, onCleanup, Show } from 'solid-js';
import { useFiles } from '../context/FilesContext.jsx';
import { Renderer } from '../components/Renderer.jsx';
import toHAST from '../utils/useParse.jsx';

const DEFAULT_TITLE = 'Texte';

function ensureDescriptionMeta() {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }

  return meta;
}

export default function View() {
  const params = useParams();
  const { getFileFromAnyStorage } = useFiles();
  const [file] = createResource(() => params.id, getFileFromAnyStorage);
  const [ast] = createResource(
    () => file(),
    (f) => toHAST(f.content, 'markdown')
  );

  createEffect(() => {
    const filename = file()?.name?.trim();
    const title = filename || DEFAULT_TITLE;
    document.title = title;

    const description = filename
      ? `Texte - ${filename}`
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
    <Show when={ast()} fallback="No file imported">
      <h1>{file().name}</h1>
      <Renderer ast={ast()} />
    </Show>
  );
}