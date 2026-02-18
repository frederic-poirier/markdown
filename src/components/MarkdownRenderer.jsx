import { For, children as resolveChildren } from "solid-js";
import { Heading } from "./renderers/Heading.jsx";
import { CodeBlock } from "./renderers/CodeBlock.jsx";
import { Paragraph } from "./renderers/Paragraph.jsx";
import { Link } from "./renderers/Link.jsx";
import { Blockquote } from "./renderers/Blockquote.jsx";
import { Checkbox, List, ListItem } from "./renderers/List.jsx";
import { Table, TableHead, TableBody, TableRow, TableCell } from "./renderers/Table.jsx";
import { Image } from "./renderers/Image.jsx";
import { Strong, Code, Del, Em, Hr } from "./renderers/Text.jsx";
import { Details, Summary } from "./renderers/Details.jsx";

// Les noeuds hast "element" avec enfants
const ELEMENT_RENDERERS = {
  h1: ({ children }) => <Heading level={1}>{children}</Heading>,
  h2: ({ children }) => <Heading level={2}>{children}</Heading>,
  h3: ({ children }) => <Heading level={3}>{children}</Heading>,
  h4: ({ children }) => <Heading level={4}>{children}</Heading>,
  h5: ({ children }) => <Heading level={5}>{children}</Heading>,
  h6: ({ children }) => <Heading level={6}>{children}</Heading>,
  p: ({ children }) => <Paragraph>{children}</Paragraph>,
  blockquote: ({ children }) => <Blockquote>{children}</Blockquote>,
  ul: ({ children }) => <List ordered={false}>{children}</List>,
  ol: ({ children }) => <List ordered={true}>{children}</List>,
  li: ({ children }) => <ListItem>{children}</ListItem>,
  strong: ({ children }) => <Strong>{children}</Strong>,
  em: ({ children }) => <Em>{children}</Em>,
  del: ({ children }) => <Del>{children}</Del>,
  a: ({ node, children }) => (
    <Link node={node} href={node.properties?.href} title={node.properties?.title}>
      {children}
    </Link>
  ),
  table: (props) => {
    const resolved = resolveChildren(() => props.children);
    const rows = resolved().filter(Boolean);
    return (
      <Table>
        <TableHead>{rows[0]}</TableHead>
        <TableBody><For each={rows.slice(1)}>{(row) => row}</For></TableBody>
      </Table>
    );
  },
  thead: ({ children }) => <>{children}</>,
  tbody: ({ children }) => <>{children}</>,
  tr: ({ node, children }) => <TableRow vAlign={node.properties?.vAlign}>{children}</TableRow>,
  th: ({ node, children }) => (
    <TableCell
      isHeader={true}
      align={node.properties?.align}
      colSpan={node.properties?.colSpan}
      rowSpan={node.properties?.rowSpan}
      width={node.properties?.width}
      vAlign={node.properties?.vAlign}
    >
      {children}
    </TableCell>
  ),
  td: ({ node, children }) => (
    <TableCell
      isHeader={false}
      align={node.properties?.align}
      colSpan={node.properties?.colSpan}
      rowSpan={node.properties?.rowSpan}
      width={node.properties?.width}
      vAlign={node.properties?.vAlign}
    >
      {children}
    </TableCell>
  ),
  details: ({ children }) => <Details>{children}</Details>,
  summary: ({ children }) => <Summary>{children}</Summary>,
  pre: ({ children }) => <>{children}</>, // CodeBlock est géré par le noeud code enfant
  hr: () => <Hr />,
  br: () => <br />,
  // Éléments passthrough — rend les enfants directement
  div: ({ children }) => <div>{children}</div>,
  span: ({ children }) => <span>{children}</span>,
};

// Les noeuds "element" feuilles (sans enfants significatifs)
const LEAF_ELEMENT_RENDERERS = {
  img: ({ node, parent }) => (
    <Image
      src={node.properties?.src}
      href={parent?.tagName === 'a' ? parent.properties?.href : undefined}
      alt={node.properties?.alt}
      title={node.properties?.title}
      align={node.properties?.align}
      width={node.properties?.width}
      height={node.properties?.height}
      vAlign={node.properties?.vAlign}
    />
  ),
  input: ({ node }) => {
    if (node.properties?.type === 'checkbox') {
      return <Checkbox checked={node.properties?.checked} disabled={node.properties?.disabled} />;
    }

    return (
      <input
        type={node.properties?.type}
        checked={node.properties?.checked}
        disabled={node.properties?.disabled}
      />
    );
  },
  code: ({ node, parent }) => {
    // <code> dans un <pre> = bloc de code
    if (parent?.tagName === 'pre') {
      const lang = node.properties?.className?.[0]?.replace('language-', '') ?? null
      const value = node.children?.[0]?.value ?? ''
      return <CodeBlock language={lang} value={value} />
    }
    // <code> inline
    const value = node.children?.[0]?.value ?? ''
    return <Code>{value}</Code>
  },
};

function HastNode({ node, parent }) {
  if (!node) return null;

  // Noeud texte
  if (node.type === 'text') return <>{node.value}</>;

  // Commentaires HTML — ignorés
  if (node.type === 'comment') return null;

  // Racine du document
  if (node.type === 'root') {
    return (
      <For each={node.children}>
        {(child) => <HastNode node={child} parent={node} />}
      </For>
    );
  }

  if (node.type === 'element') {
    const tag = node.tagName;

    // Cas spéciaux feuilles
    const LeafRenderer = LEAF_ELEMENT_RENDERERS[tag];
    if (LeafRenderer) return <LeafRenderer node={node} parent={parent} />;

    // Éléments avec enfants
    const Renderer = ELEMENT_RENDERERS[tag];
    const children = (
      <For each={node.children}>
        {(child) => <HastNode node={child} parent={node} />}
      </For>
    );

    if (Renderer) return <Renderer node={node}>{children}</Renderer>;

    // Fallback : élément inconnu, on rend quand même les enfants
    console.warn(`[HAST] Élément inconnu : <${tag}>`, node);
    return <>{children}</>;
  }

  console.warn(`[HAST] Noeud inconnu : "${node.type}"`, node);
  return null;
}

export function MarkdownRenderer({ ast }) {
  return <HastNode node={ast} />;
}