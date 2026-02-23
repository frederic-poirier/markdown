import { useParams } from "@solidjs/router";
import { createEffect, createResource, onCleanup, Show } from "solid-js";
import { useFiles } from "../context/FilesContext.jsx";
import { getCodeLanguage } from "../utils/fileMode.js";

const DEFAULT_TITLE = "Code";

function ensureDescriptionMeta() {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "description");
    document.head.appendChild(meta);
  }

  return meta;
}

export default function CodeView() {
  const params = useParams();
  const { getFile } = useFiles();
  const [file] = createResource(() => params.id, getFile);

  createEffect(() => {
    const filename = file()?.name?.trim();
    const title = filename || DEFAULT_TITLE;
    document.title = title;

    const description = filename ? `Code - ${filename}` : DEFAULT_TITLE;

    const descriptionMeta = ensureDescriptionMeta();
    descriptionMeta.setAttribute("content", description);
  });

  onCleanup(() => {
    document.title = DEFAULT_TITLE;
    const descriptionMeta = ensureDescriptionMeta();
    descriptionMeta.setAttribute("content", DEFAULT_TITLE);
  });

  return <h1>code</h1>;
}
