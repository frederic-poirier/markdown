import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeParse from "rehype-parse";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

const DEFAULT_CACHE_MAX_BYTES = 3 * 1024 * 1024;
const parseCache = new Map();
let parseCacheSize = 0;

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw);

const htmlProcessor = unified().use(rehypeParse, { fragment: true });

function cacheKey(text, type) {
  return `${type || "unknown"}:${text}`;
}

function estimateNodeSize(text) {
  return new TextEncoder().encode(text || "").length;
}

function readFromCache(key) {
  const entry = parseCache.get(key);
  if (!entry) return null;

  parseCache.delete(key);
  parseCache.set(key, entry);
  return structuredClone(entry.value);
}

function writeToCache(key, value, size) {
  const existing = parseCache.get(key);
  if (existing) {
    parseCacheSize -= existing.size;
    parseCache.delete(key);
  }

  parseCache.set(key, { value, size });
  parseCacheSize += size;

  while (parseCacheSize > DEFAULT_CACHE_MAX_BYTES && parseCache.size > 0) {
    const firstKey = parseCache.keys().next().value;
    if (!firstKey) break;

    const removed = parseCache.get(firstKey);
    parseCache.delete(firstKey);
    parseCacheSize -= removed?.size || 0;
  }
}

export async function toHAST(text, type) {
  const key = cacheKey(text, type);
  const cached = readFromCache(key);
  if (cached) {
    return cached;
  }

  let value = null;
  if (type === "markdown") {
    const mdast = markdownProcessor.parse(text);
    value = await markdownProcessor.run(mdast);
  } else if (type === "html") {
    value = htmlProcessor.parse(text);
  }

  if (value) {
    writeToCache(key, value, estimateNodeSize(text));
    return structuredClone(value);
  }

  return null;
}

