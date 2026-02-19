import { Match } from "solid-js"
import { ShikiBlock } from "./ShikiBlock.jsx"
import { MermaidBlock } from "./MermaidBlock.jsx"

export function CodeBlock(props) {
  return (
    <Switch>
      <Match when={props.node.properties.language === "mermaid"}>
        <MermaidBlock value={props.node.properties.value} />
      </Match>
      <Match when={true}>
        <ShikiBlock value={props.node.properties.value} language={props.node.properties.language} />
      </Match>
    </Switch>
  )
}

