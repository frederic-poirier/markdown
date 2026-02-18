import { useParams } from "@solidjs/router";
import { createResource, Show } from "solid-js";
import { getFile } from "../db/file";
import { MarkdownRenderer } from "../components/MarkdownRenderer";
import toHAST from "../utils/useParse";

export default function View() {
  const params = useParams();
  const [file] = createResource(() => params.id, getFile);
  const [ast] = createResource(
    () => file(),
    (f) => toHAST(f.content, 'markdown')
  );

  return (
    <Show when={ast()} fallback="No file imported">
      <h1>{file().name}</h1>
      <MarkdownRenderer ast={ast()} />
    </Show>
  );
}