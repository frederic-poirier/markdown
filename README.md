# Markdown Viewer

A fast, customizable CLI tool to visualize Markdown files in your browser with live hot reload.

## Release Notes (2026-02-18)

- Added mode-based routes: `/text/:id`, `/code/:id`, `/media/:id` with `/view/:id` redirect compatibility.
- Expanded ingestion to support text/code files (web input + `texte-upload` CLI), not only `.md`.
- Introduced file mode resolution (`text`/`code`/`media`) with metadata propagation through local/cloud flows.
- Fixed Mermaid error behavior to prevent leaked error SVG artifacts outside layout.
- Updated `CodeView` to render `CodeBlock` without boxy container styles (no padding, background, or border).

## Features

- **Live Hot Reload**: Automatically refreshes when markdown files change
- **SolidJS + Tailwind CSS 4**: Modern, fast, fully customizable components
- **GitHub Flavored Markdown**: Tables, task lists, strikethrough, and more
- **Syntax Highlighting**: Beautiful code blocks with copy buttons
- **Tailscale Integration**: Auto-detects Tailscale IP for network access
- **File Browser**: Select from all markdown files in your directory
- **URL-based Navigation**: Direct file access via URLs

## Tech Stack

- **Runtime**: Bun
- **Frontend**: SolidJS (not SolidStart)
- **Styling**: Tailwind CSS 4
- **Markdown Processing**: unified + remark + rehype ecosystem
- **Dev Server**: Vite with HMR
- **Production Server**: Bun native HTTP server

## Installation

```bash
bun install
```

## Usage

### Global CLI upload to texte.zip

You can install the project CLI globally and upload `.md` files through the API (`/api/files/:id`), which stores data in R2 + D1 index.

```bash
# from this repository root
npm link

# auto-read session from Firefox/Chromium, prompt OAuth if invalid
texte-upload ./README.md

# upload one file to production
TEXTE_SESSION="<session_token>" texte-upload ./README.md

# upload a directory to localhost (dev)
texte-upload ./docs --url http://localhost:7000 --cookie "session=<session_token>"
```

The command recursively scans directories and uploads all `.md` files found.

It stores the last valid session cookie in `~/.config/texte-upload/session.json`.
If no valid cookie is found, it opens `${baseUrl}/auth/login` and retries reading from browser cookies.

To fetch a session token, login first in browser:

```bash
xdg-open "http://localhost:7000/auth/login"
```

Then copy cookie `session` from browser devtools and pass it via `TEXTE_SESSION`, `TEXTE_COOKIE`, or `--cookie`.

You can force browser source:

```bash
texte-upload ./docs --browser firefox
texte-upload ./docs --browser chromium
```

### Development Mode

Run the development server with hot module replacement for both markdown files and SolidJS components:

```bash
# Terminal 1: Start Vite dev server (port 5173)
bun run dev:vite

# Terminal 2: Start Bun API server (port 3000)
bun run dev:server

# Or run both at once:
bun dev
```

Then open http://localhost:5173 in your browser.

### Production Mode

Build the SolidJS app and run the production server:

```bash
# Build the frontend
bun run build

# Start the server (scans current directory for .md files)
bun run serve
```

The server will:
1. Scan the current directory for all `.md` files
2. Start serving on your Tailscale IP (or 0.0.0.0 if Tailscale is not available)
3. Print URLs for all found markdown files

Example output:
```
✨ Markdown viewer running at: http://100.73.186.82:3000

Available markdown files:
   http://100.73.186.82:3000/example.md
   http://100.73.186.82:3000/docs/readme.md
```

## Customization

All rendering components are fully customizable. Edit the files in `src/components/renderers/` to change how markdown elements are displayed:

- **Heading.jsx**: Customize h1-h6 styling
- **CodeBlock.jsx**: Modify code block appearance, add features to copy button
- **Paragraph.jsx**: Change paragraph styling
- **Link.jsx**: Customize link behavior and appearance
- **Blockquote.jsx**: Style blockquotes
- **List.jsx**: Customize ordered/unordered lists and task lists
- **Table.jsx**: Modify table styling and layout
- **Image.jsx**: Control image display

### Example: Customizing Headings

Edit `src/components/renderers/Heading.jsx`:

```jsx
export function Heading(props) {
  const level = props.level || 'h1';
  
  const classes = {
    h1: 'text-5xl font-extrabold mt-10 mb-6 text-purple-900', // Your custom styles
    h2: 'text-4xl font-bold mt-8 mb-4 text-purple-800',
    // ... customize all heading levels
  };
  
  const Component = level;
  
  return (
    <Component id={props.id} class={classes[level]}>
      {props.children}
    </Component>
  );
}
```

After editing, rebuild:

```bash
bun run build
```

Or use dev mode to see changes instantly with HMR.

## Project Structure

```
markdown/
├── src/                          # SolidJS app (fully customizable)
│   ├── index.jsx                 # Entry point
│   ├── App.jsx                   # Main app with fetch + WebSocket
│   ├── styles/
│   │   └── index.css             # Tailwind 4 imports + custom styles
│   └── components/
│       ├── Layout.jsx            # Page wrapper
│       ├── MarkdownRenderer.jsx  # HAST → SolidJS mapper
│       └── renderers/            # Customize these!
│           ├── Heading.jsx
│           ├── CodeBlock.jsx
│           ├── Paragraph.jsx
│           ├── Link.jsx
│           ├── Blockquote.jsx
│           ├── List.jsx
│           ├── Table.jsx
│           └── Image.jsx
├── server/                       # Bun server (plain JS)
│   ├── index.js                  # CLI entry point
│   ├── server.js                 # HTTP + WebSocket server
│   ├── markdown-processor.js     # remark/rehype pipeline
│   └── file-watcher.js           # File scanning + watching
├── dist/                         # Built SolidJS app (gitignored)
├── package.json
├── vite.config.js
└── index.html                    # Vite entry point
```

## How It Works

### Markdown Processing Pipeline

```
Markdown file 
  → remark-parse (parse markdown)
  → remark-gfm (GitHub Flavored Markdown)
  → remark-rehype (convert to HTML AST)
  → rehype-slug (add IDs to headings)
  → rehype-autolink-headings (add anchor links)
  → rehype-highlight (syntax highlighting)
  → HAST JSON
  → Client receives JSON
  → MarkdownRenderer maps HAST to SolidJS components
  → Rendered in browser
```

### Hot Reload Flow

1. Server watches all `.md` files in directory
2. When a file changes, server sends WebSocket message to client
3. Client receives message and refetches markdown content
4. SolidJS reactively updates the UI

### Dev vs Production

**Dev Mode:**
- Vite serves the SolidJS app with HMR on port 5173
- Bun server provides API endpoints on port 3000
- Vite proxies `/api` and `/ws` to Bun server
- Edit SolidJS components → instant HMR
- Edit markdown files → WebSocket reload

**Production Mode:**
- Bun server serves pre-built `/dist` folder
- All requests handled by single Bun server
- Lighter, faster, no Vite overhead

## API Endpoints

- `GET /api/markdown?path=<file>` - Returns HAST JSON for markdown file
- `GET /api/files` - Returns list of all markdown files
- `WS /ws` - WebSocket for hot reload notifications

## Extending

### Adding New Markdown Features

Install a rehype/remark plugin:

```bash
bun add rehype-katex  # Example: add math support
```

Update `server/markdown-processor.js`:

```javascript
import rehypeKatex from 'rehype-katex';

export async function processMarkdownToHast(filePath) {
  // ... existing code
  
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
    .use(rehypeHighlight)
    .use(rehypeKatex)  // Add your plugin
    
  // ... rest of code
}
```

### Creating Custom Components

Create a new renderer in `src/components/renderers/`:

```jsx
// src/components/renderers/CustomElement.jsx
export function CustomElement(props) {
  return (
    <div class="custom-styling">
      {props.children}
    </div>
  );
}
```

Import and use in `MarkdownRenderer.jsx`:

```javascript
import { CustomElement } from './renderers/CustomElement';

// Add case in switch statement
case 'your-element':
  return <CustomElement {...props} />;
```

## Troubleshooting

### "dist/index.html not found"

Run `bun run build` before starting the production server.

### No markdown files found

Make sure you're running the server from a directory containing `.md` files.

### WebSocket connection failed

Ensure both Vite dev server (port 5173) and Bun server (port 3000) are running in dev mode.

### Tailscale IP not detected

Install Tailscale CLI or the server will fallback to `0.0.0.0`.

## License

MIT
