import { For } from "solid-js";
import { Dynamic } from "solid-js/web";

import { transformHAST } from "./transformHAST.js";

import { Heading } from "./renderers/TextBlock/Heading.jsx";
import { Paragraph } from "./renderers/TextBlock/Paragraph.jsx";
import { Link } from "./renderers/TextInline/Link.jsx";
import { Blockquote } from "./renderers/TextBlock/Blockquote.jsx";
import { Checkbox, List, ListItem } from "./renderers/TextBlock/List.jsx";
import { Image } from "./renderers/ElementBlock/Image.jsx";
import { Strong, Code, Del, Em, Hr } from "./renderers/TextInline/Text.jsx";
import { Details, Summary } from "./renderers/TextBlock/Details.jsx";
import { CodeBlock } from "./renderers/CodeBlock/CodeBlock.jsx";
import { Gallery } from "./renderers/ElementBlock/Gallery.jsx";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "./renderers/ElementBlock/Table.jsx";

const ELEMENT_RENDERERS = new Map([
  ["h1", Heading],
  ["h2", Heading],
  ["h3", Heading],
  ["h4", Heading],
  ["h5", Heading],
  ["h6", Heading],

  ["gallery", Gallery],

  ["p", Paragraph],
  ["blockquote", Blockquote],

  ["ul", List],
  ["ol", List],
  ["li", ListItem],

  ["strong", Strong],
  ["em", Em],
  ["del", Del],
  ["kbd", Code],

  ["details", Details],
  ["summary", Summary],

  ["table", Table],
  ["thead", TableHead],
  ["tbody", TableBody],
  ["tr", TableRow],
  ["th", TableCell],
  ["td", TableCell],

  ["a", Link],
  ["img", Image],
  ["input", Checkbox],
  ["code", Code],
  ["codeblock", CodeBlock],

  ["hr", Hr],
  ["br", "br"],
  ["div", "div"],
  ["span", "span"],
]);

export function RenderHAST({ ast }) {
  const transformed = transformHAST(structuredClone(ast));
  return <HastNode node={transformed} parent={null} />;
}

function HastNode({ node, parent }) {
  if (!node) return null;

  if (node.type === "root") return renderChildren(node);
  if (node.type === "element") return renderElement(node, parent);
  if (node.type === "text") return <>{node.value}</>;
  if (node.type === "comment") return null;

  console.warn(`[HAST] Unknown node type: "${node.type}"`, node);
  return null;
}

function renderElement(node, parent) {
  const ElementRenderer = ELEMENT_RENDERERS.get(node.tagName);
  const children = renderChildren(node);

  if (!ElementRenderer) return renderInvalid(ElementRenderer, node, children);
  if (typeof ElementRenderer === "string")
    return renderString(ElementRenderer, node, children);
  if (typeof ElementRenderer !== "function")
    return renderInvalid(ElementRenderer, node, children);
  return render(ElementRenderer, node, children, parent);
}

function renderChildren(node) {
  if (!node.children?.length) return null;
  return (
    <For each={node.children}>
      {(child) => <HastNode node={child} parent={node} />}
    </For>
  );
}

function render(Element, node, children, parent) {
  try {
    return (
      <Element {...node.properties} node={node} parent={parent}>
        {children}
      </Element>
    );
  } catch (error) {
    console.error(`[HAST] Renderer crash on <${node.tagName}>`, error, node);
    return <>{children}</>;
  }
}

function renderString(element, node, children) {
  return (
    <Dynamic component={element} {...node.properties}>
      {children}
    </Dynamic>
  );
}

function renderInvalid(element, node, children) {
  console.warn(`[HAST] Invalid renderer for <${node.tagName}>:`, element, node);
  return <>{children}</>;
}
