import { useParams } from "@solidjs/router";
import { createEffect, createResource, onCleanup, Show } from "solid-js";
import { useFiles } from "../context/FilesContext.jsx";
import { toHAST } from "../markdown/toHAST.jsx";
import { RenderHAST } from "../markdown/renderHAST.jsx";

const DEFAULT_TITLE = "Text";

function ensureDescriptionMeta() {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }

  return meta;
}

export default function TextView() {
  const params = useParams();
  const { getFileFromAnyStorage } = useFiles();
  const [file] = createResource(() => params.id, getFileFromAnyStorage);
  const [ast] = createResource(
    () => file(),
    (entry) => toHAST(entry.content, "markdown"),
  );

  createEffect(() => {
    const filename = file()?.name?.trim();
    const title = filename || DEFAULT_TITLE;
    document.title = title;

    const description = filename ? `Text - ${filename}` : DEFAULT_TITLE;

    const descriptionMeta = ensureDescriptionMeta();
    descriptionMeta.setAttribute("content", description);
  });

  onCleanup(() => {
    document.title = DEFAULT_TITLE;
    const descriptionMeta = ensureDescriptionMeta();
    descriptionMeta.setAttribute("content", DEFAULT_TITLE);
  });

  return (
    <Show when={ast()}>
      <RenderHAST ast={ast()} />
    </Show>
  );
}
