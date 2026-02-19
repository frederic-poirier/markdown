import { For } from "solid-js";
import { Dynamic } from 'solid-js/web';

import { Heading } from "./renderers/Heading.jsx";
import { Paragraph } from "./renderers/Paragraph.jsx";
import { Link } from "./renderers/Link.jsx";
import { Blockquote } from "./renderers/Blockquote.jsx";
import { Checkbox, List, ListItem } from "./renderers/List.jsx";
import { Table, TableHead, TableBody, TableRow, TableCell } from "./renderers/Table.jsx";
import { Image } from "./renderers/Image.jsx";
import { Strong, Code, Del, Em, Hr } from "./renderers/Text.jsx";
import { Details, Summary } from "./renderers/Details.jsx";
import { CodeBlock } from "./renderers/CodeBlock.jsx";
import { Gallery } from "./renderers/Gallery.jsx";
import { transformLayout } from "./useRules.js";

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

  ["hr", Hr],
  ["br", "br"],
  ["div", "div"],
  ["span", "span"]
]);


function HastNode({ node, parent }) {
  if (!node) return null;

  if (node.type === "root") return renderChildren(node)
  if (node.type === "element") return renderElement(node, parent)
  if (node.type === "text") return <>{node.value}</>
  if (node.type === "comment") return null

  console.warn(`[HAST] Unknown node type: "${node.type}"`, node)
  return null
}

function renderElement(node, parent) {
  if (node.tagName === 'pre') {
    return <>{renderChildren(node)}</>;
  }

  if (node.tagName === 'code' && parent?.tagName === 'pre') {
    return (
      <CodeBlock
        node={node}
        parent={parent}
        language={extractCodeLanguage(node.properties?.className)}
        value={readTextContent(node)}
      />
    );
  }

  const ElementRenderer = ELEMENT_RENDERERS.get(node.tagName);
  const children = renderChildren(node);

  if (!ElementRenderer) {
    console.warn(`[HAST] Unknown element: <${node.tagName}>`, node);
    return <>{children}</>;
  }

  if (typeof ElementRenderer === 'string') {
    return (
      <Dynamic component={ElementRenderer} {...node.properties}>
        {children}
      </Dynamic>
    );
  }

  if (typeof ElementRenderer !== "function") {
    console.warn(
      `[HAST] Invalid renderer for <${node.tagName}>:`,
      ElementRenderer,
      node
    );
    return <>{children}</>;
  }

  try {
    return (
      <ElementRenderer
        {...node.properties}
        node={node}
        parent={parent}
      >
        {children}
      </ElementRenderer>
    );
  } catch (error) {
    console.error(`[HAST] Renderer crash on <${node.tagName}>`, error, node);
    return <>{children}</>;
  }
}

function renderChildren(node) {
  if (!node.children?.length) return null;
  return (
    <For each={node.children}>
      {(child) => <HastNode node={child} parent={node} />}
    </For>
  )
}

export function Renderer({ ast }) {
  const transformed = transformLayout(structuredClone(ast));
  return <HastNode node={transformed} parent={null} />;
}

function extractCodeLanguage(className) {
  if (Array.isArray(className)) {
    const classToken = className.find((entry) => entry?.startsWith('language-'));
    return classToken?.replace('language-', '') || undefined;
  }

  if (typeof className === 'string') {
    const classToken = className
      .split(/\s+/)
      .find((entry) => entry?.startsWith('language-'));

    return classToken?.replace('language-', '') || undefined;
  }

  return undefined;
}

function readTextContent(node) {
  if (!node) return '';
  if (node.type === 'text') return node.value || '';
  if (!node.children?.length) return '';

  return node.children.map((child) => readTextContent(child)).join('');
}
