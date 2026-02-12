import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { read } from 'to-vfile';

function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
    .use(rehypeHighlight);
}

export async function processMarkdownToHast(filePath) {
  try {
    const file = await read(filePath);
    const processor = createProcessor();
    const ast = await processor.run(processor.parse(file));
    
    return {
      type: 'root',
      children: ast.children || []
    };
  } catch (error) {
    console.error('Error processing markdown to HAST:', error);
    throw error;
  }
}

export function processMarkdownStringToHast(markdownText) {
  try {
    const processor = createProcessor();
    const ast = processor.runSync(processor.parse(markdownText));
    
    return {
      type: 'root',
      children: ast.children || []
    };
  } catch (error) {
    console.error('Error processing markdown string to HAST:', error);
    throw error;
  }
}
