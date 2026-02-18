import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeParse from 'rehype-parse'
import rehypeRaw from 'rehype-raw'
import remarkGfm from 'remark-gfm'

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)

const htmlProcessor = unified()
  .use(rehypeParse, { fragment: true })


export default async function toHAST(text, type) {
  if (type === "markdown") {
    const mdast = markdownProcessor.parse(text)
    return await markdownProcessor.run(mdast)
  } else if (type === "html") {
    return htmlProcessor.parse(text)
  }
}