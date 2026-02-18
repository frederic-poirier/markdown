# AGENTS.md

Coding agent instructions for the markdown-viewer repository.

## Build Commands

```bash
# Install dependencies
bun install

# Development server (Vite + Cloudflare)
bun run dev

# Build for production
bun run build

# Deploy to Cloudflare (if configured)
bunx wrangler deploy
```

**Note**: No lint or test commands are currently configured in this project.

## Project Structure

- **Frontend**: SolidJS in `src/` - single-page app, NOT SolidStart
- **Backend**: Cloudflare Pages Functions in `functions/` - file-based routing
- **Styling**: Tailwind CSS 4 with `@theme` directive in `src/index.css`
- **Runtime**: Bun locally, Cloudflare Workers in production

## Code Style Guidelines

### Module System
- ES modules only (`"type": "module"` in package.json)
- Use `.jsx` extension for components, `.js` for utilities
- Use `.js` extension in imports (e.g., `import './App.js'`)

### Naming Conventions
- **Components**: PascalCase (e.g., `Layout.jsx`, `Home.jsx`)
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: Match default export name

### Code Formatting
- **Indentation**: 4 spaces (no tabs)
- **Quotes**: Single quotes for strings and imports
- **Semicolons**: Use semicolons at end of statements
- **Line length**: ~100 characters soft limit

### Imports Order
```javascript
// Framework imports first
import { Router, Route } from '@solidjs/router';
import { render } from 'solid-js/web';

// Third-party imports
import { Toaster } from 'solid-sonner';

// Local imports (use .js extension)
import Layout from './components/Layout.jsx';
import { addUser } from '../utils/db/users.js';

// CSS imports last
import './index.css';
```

### Component Patterns (SolidJS)

```jsx
export default function ComponentName(props) {
    return (
        <div class="tailwind-classes">
            {props.children}
        </div>
    );
}

// Fragments when multiple roots
export default function Layout(props) {
    return (
        <>
            <nav>...</nav>
            <main>{props.children}</main>
        </>
    );
}
```

### SolidJS Specifics
- Use `class` attribute (not `className`) for Tailwind classes
- Use `Show` component for conditional rendering: `<Show when={cond}>...</Show>`
- Use `For` component for lists: `<For each={items}>{(item) => ...}</For>`
- Use `createSignal`, `createContext`, `useContext` from 'solid-js'
- Use `onMount` and `onCleanup` for lifecycle management
- Lucide icons: `import IconName from 'lucide-solid/icons/icon-name'`

### Cloudflare Functions Patterns

```javascript
// API route with POST
export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const body = await request.json();
        return new Response(JSON.stringify({ success: true, data }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Handler error:', error);
        return new Response(JSON.stringify({ error: 'Error message' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
```

### Error Handling
- Use try/catch for async operations
- Return proper HTTP status codes (400, 401, 500, etc.)
- Log errors to console: `console.error('Operation:', error)`
- Return JSON error responses for API routes

### Authentication Patterns
- Use session-based auth with HttpOnly cookies
- Use `buildSessionCookie()` from utils for setting cookies
- Check `requireAuth()` middleware pattern for protected routes

### CSS/Styling
- Use Tailwind CSS 4 utility classes
- Custom theme values in `@theme` block in `src/index.css`
- Use `class` over `className` (SolidJS uses standard HTML)

### Markdown Renderer Pattern
Renderers in `src/components/renderers/` with PascalCase names:
- Each renderer is a separate component (Heading.jsx, Paragraph.jsx, etc.)
- Use `props.node` to access AST node data
- Use `props.children` for nested content

```jsx
export default function Heading(props) {
    const level = props.node?.properties?.level || 1;
    const Tag = `h${level}`;
    return <Tag class={`heading-${level}`}>{props.children}</Tag>;
}
```

### Testing
No test suite configured. If adding tests:
- Use Vitest for unit tests
- Place tests in `__tests__/` or `*.test.js` files

### Environment Variables
- **Local dev**: `.dev.vars` file (gitignored)
- **Cloudflare**: `wrangler.toml` or Cloudflare dashboard
- **Code**: `context.env.VAR_NAME` in functions

Required env vars:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI`
- `SESSION_SECRET` (for JWT signing)
- `WHITELIST_EMAILS` (comma-separated)
- `DB` (D1 database binding)

### Git
- No pre-commit hooks configured
- Do not commit `.dev.vars` or secrets
