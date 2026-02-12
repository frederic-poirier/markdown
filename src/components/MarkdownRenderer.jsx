import { For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Heading } from './renderers/Heading';
import { CodeBlock } from './renderers/CodeBlock';
import { Paragraph } from './renderers/Paragraph';
import { Link } from './renderers/Link';
import { Blockquote } from './renderers/Blockquote';
import { List, ListItem } from './renderers/List';
import { Table, TableHead, TableBody, TableRow, TableCell } from './renderers/Table';
import { Image } from './renderers/Image';

function getClassName(props) {
  if (!props.className) return undefined;
  if (Array.isArray(props.className)) return props.className.join(' ');
  return String(props.className);
}

function renderNode(node, index, parentTag) {
  if (!node) return null;

  // Text node
  if (node.type === 'text') {
    return node.value;
  }

  // Element node
  if (node.type === 'element') {
    const props = node.properties || {};
    const children = node.children?.map((child, i) => renderNode(child, i, node.tagName));

    switch (node.tagName) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return <Heading level={node.tagName} id={props.id}>{children}</Heading>;

      case 'p':
        return <Paragraph>{children}</Paragraph>;

      case 'a': {
        // If inside a heading, don't render as a styled link - just pass through children
        if (parentTag && /^h[1-6]$/.test(parentTag)) {
          return <>{children}</>;
        }
        return <Link href={props.href}>{children}</Link>;
      }

      case 'blockquote':
        return <Blockquote>{children}</Blockquote>;

      case 'ul':
        return <List ordered={false}>{children}</List>;

      case 'ol':
        return <List ordered={true}>{children}</List>;

      case 'li':
        return <ListItem>{children}</ListItem>;

      case 'pre':
        return <CodeBlock>{children}</CodeBlock>;

      case 'code': {
        const cls = getClassName(props);
        if (parentTag === 'pre') {
          // Code inside pre: this is a fenced code block, render with highlighting classes
          return <code class={cls}>{children}</code>;
        }
        // Inline code
        return (
          <code class="bg-neutral-900 px-1.5 py-0.5 rounded text-[0.8125rem] font-mono text-neutral-200 border border-neutral-800">
            {children}
          </code>
        );
      }

      case 'table':
        return <Table>{children}</Table>;

      case 'thead':
        return <TableHead>{children}</TableHead>;

      case 'tbody':
        return <TableBody>{children}</TableBody>;

      case 'tr':
        return <TableRow>{children}</TableRow>;

      case 'th':
        return <TableCell isHeader={true}>{children}</TableCell>;

      case 'td':
        return <TableCell isHeader={false}>{children}</TableCell>;

      case 'img':
        return <Image src={props.src} alt={props.alt} />;

      case 'strong':
      case 'b':
        return <strong class="font-semibold text-neutral-100">{children}</strong>;

      case 'em':
      case 'i':
        return <em class="italic text-neutral-300">{children}</em>;

      case 'del':
        return <del class="line-through text-neutral-500">{children}</del>;

      case 'hr':
        return <hr class="my-12 border-0 h-px bg-neutral-800" />;

      case 'br':
        return <br />;

      case 'input': {
        // Task list checkboxes
        if (props.type === 'checkbox') {
          return (
            <input
              type="checkbox"
              checked={props.checked}
              disabled
              class="mr-2 accent-neutral-400 relative top-[1px]"
            />
          );
        }
        return <input {...props} />;
      }

      case 'div': {
        const cls = getClassName(props);
        return <div class={cls}>{children}</div>;
      }

      case 'span': {
        const cls = getClassName(props);
        return <span class={cls}>{children}</span>;
      }

      default: {
        const cls = getClassName(props);
        return <Dynamic component={node.tagName} class={cls}>{children}</Dynamic>;
      }
    }
  }

  // Root node
  if (node.type === 'root' && node.children) {
    return <>{node.children.map((child, i) => renderNode(child, i, 'root'))}</>;
  }

  return null;
}

export function MarkdownRenderer(props) {
  return (
    <div class="markdown-content my-8">
      <Show when={props.ast} fallback={<div class="text-neutral-500">No content</div>}>
        <div>
          {renderNode(props.ast)}
        </div>
      </Show>
    </div>
  );
}
