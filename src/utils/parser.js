import TurndownService from "turndown"
import { unified } from "unified"
import remarkGfm from "remark-gfm"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"

const turndownProcessor = new TurndownService
const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)

export function htmlToMarkdown(html) {
  return turndownProcessor.turndown(html)
}

export function markdownToHAST(markdown) {
  return markdownProcessor.parse(markdown)
}

