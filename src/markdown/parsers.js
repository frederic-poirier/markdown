import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import TurndownService from "turndown";

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw);

const htmlProcessor = new TurndownService()


export async function markdownToHAST(markdown) {
  const mdast = markdownProcessor.parse(markdown)
  const hast = await markdownProcessor.run(mdast)
  return hast
}


export function htmlToMarkdown(html) {
  return htmlProcessor.turndown(html)
}


