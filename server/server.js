import { join, basename } from 'path';
import { readFile, stat, writeFile } from 'fs/promises';
import { watch } from 'fs';
import { processMarkdownToHast, processMarkdownStringToHast } from './markdown-processor.js';

const clients = new Set();

export async function startServer({ cwd, host, port, markdownFiles }) {
  // Mutable file list so uploads get added
  const files = [...markdownFiles];
  const fileWatchers = [];

  function watchFile(relativePath) {
    const fullPath = join(cwd, relativePath);
    try {
      const watcher = watch(fullPath, (eventType) => {
        if (eventType === 'change') {
          const message = JSON.stringify({ type: 'reload', path: relativePath });
          for (const client of clients) {
            client.send(message);
          }
        }
      });
      fileWatchers.push(watcher);
    } catch (e) {
      // ignore watch errors
    }
  }

  // Watch existing files
  for (const f of files) {
    watchFile(f);
  }

  const server = Bun.serve({
    host,
    port,
    async fetch(req, server) {
      const url = new URL(req.url);
      
      // WebSocket upgrade
      if (url.pathname === '/ws') {
        const upgraded = server.upgrade(req);
        if (!upgraded) {
          return new Response('WebSocket upgrade failed', { status: 500 });
        }
        return undefined;
      }
      
      // API: Get markdown content as HAST (from file)
      if (url.pathname === '/api/markdown' && req.method === 'GET') {
        const filePath = url.searchParams.get('path');
        
        if (!filePath) {
          return Response.json({ error: 'Missing path parameter' }, { status: 400 });
        }
        
        try {
          const fullPath = join(cwd, filePath);
          const hast = await processMarkdownToHast(fullPath);
          return Response.json({ hast, path: filePath });
        } catch (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }
      }
      
      // API: Preview raw markdown text
      if (url.pathname === '/api/preview' && req.method === 'POST') {
        try {
          const body = await req.json();
          const markdown = body.markdown;
          
          if (!markdown || typeof markdown !== 'string') {
            return Response.json({ error: 'Missing markdown field' }, { status: 400 });
          }
          
          const hast = processMarkdownStringToHast(markdown);
          return Response.json({ hast });
        } catch (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }
      }
      
      // API: Upload markdown file (saves to CWD permanently)
      if (url.pathname === '/api/upload' && req.method === 'POST') {
        try {
          const formData = await req.formData();
          const file = formData.get('file');
          
          if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
          }
          
          let fileName = file.name;
          if (!fileName.endsWith('.md')) {
            fileName += '.md';
          }
          
          // Sanitize filename
          fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
          
          const fullPath = join(cwd, fileName);
          const content = await file.text();
          
          await writeFile(fullPath, content, 'utf-8');
          
          // Add to file list if not already there
          if (!files.includes(fileName)) {
            files.push(fileName);
            watchFile(fileName);
          }
          
          return Response.json({ path: fileName });
        } catch (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }
      }
      
      // API: Get list of markdown files
      if (url.pathname === '/api/files') {
        return Response.json({ files });
      }
      
      // Serve static files from dist
      if (process.env.NODE_ENV === 'production' || !process.env.NODE_ENV) {
        const scriptDir = import.meta.dir.replace('/server', '');
        let distPath = join(scriptDir, 'dist');
        
        try {
          await stat(distPath);
        } catch {
          distPath = join(cwd, 'dist');
        }
        
        // Serve index.html for .md paths, root, /paste
        if (url.pathname === '/' || url.pathname.endsWith('.md') || url.pathname === '/paste') {
          try {
            const indexHtml = await readFile(join(distPath, 'index.html'), 'utf-8');
            return new Response(indexHtml, {
              headers: { 'Content-Type': 'text/html' }
            });
          } catch (error) {
            return new Response('dist/index.html not found. Run "bun build" first.', { status: 404 });
          }
        }
        
        // Serve other static files
        try {
          const filePath = join(distPath, url.pathname);
          const fileStats = await stat(filePath);
          
          if (fileStats.isFile()) {
            const f = Bun.file(filePath);
            return new Response(f);
          }
        } catch (error) {
          // File not found
        }
      }
      
      return new Response('Not found', { status: 404 });
    },
    
    websocket: {
      open(ws) {
        clients.add(ws);
      },
      message(ws, message) {},
      close(ws) {
        clients.delete(ws);
      }
    }
  });
  
  return server;
}
