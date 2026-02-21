import { useParams } from "@solidjs/router";
import { createResource, Show } from "solid-js";
import { useFiles } from "../context/FilesContext.jsx";
import { markdownToHAST } from "../markdown/parsers.js"
import { RenderHAST } from "../markdown/renderHAST.jsx";

export default function TextView() {
  const params = useParams();
  const { getFileFromAnyStorage } = useFiles();
  const [file] = createResource(() => params.id, getFileFromAnyStorage);
  const [ast] = createResource(
    () => file(),
    (entry) => markdownToHAST(entry.content),
  );

  return (
    <Show when={ast()}>
      <RenderHAST ast={ast()} />
    </Show>
  );
}
