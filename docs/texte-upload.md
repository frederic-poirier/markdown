# texte-upload

CLI to upload markdown and code files to the Texte API.

## Install

```bash
# from repository root
npm link
```

## Usage

```bash
texte-upload <file-or-dir> [more paths...] [options]
```

Options:

- `--url <baseUrl>`: API base URL (default: `https://texte.zip`)
- `--token <sessionToken>`: session token value (without `session=`)
- `--help`: show help

Environment variables:

- `TEXTE_API_URL`: default API base URL
- `TEXTE_SESSION`: session token value

## Allowed File Types

The CLI only uploads files whose extension is in these sets.

Markdown:

- `md`
- `markdown`
- `mdx`

Code:

- `c`, `cc`, `cpp`, `cs`, `css`, `go`, `h`, `hpp`, `html`, `java`, `js`, `jsx`
- `kt`, `lua`, `m`, `php`, `pl`, `py`, `r`, `rb`, `rs`, `scala`, `sh`, `sql`
- `swift`, `ts`, `tsx`, `vue`, `xml`, `yaml`, `yml`, `json`

Notes:

- Other file types are ignored.
- Empty files are skipped.
- Directory inputs are scanned recursively.

## Auth / Token Flow

The CLI authenticates using cookie header `session=<token>`.

Resolution order:

1. `--token`
2. `TEXTE_SESSION`
3. Stored token in `~/.config/texte-upload/session.json` (same `baseUrl`)
4. Interactive terminal prompt (up to 3 attempts)

Token validation endpoint:

- `GET /auth/me`

Stored token file:

- Path: `~/.config/texte-upload/session.json`
- Updated when a token is validated.

## Upload Contract

Each file is uploaded as:

- `POST /api/file/:id`
- Body: JSON `{ "name": "<filename>", "content": "<utf8-content>" }`
- `:id` is SHA-256 of file content.

## Examples

```bash
# Upload one markdown file
texte-upload ./README.md

# Upload recursively to local dev
texte-upload ./src --url http://localhost:7000

# Explicit token
texte-upload ./docs --token "<session-token>"

# Env-based token
TEXTE_SESSION="<session-token>" texte-upload ./docs
```

## Removed Behavior

Not supported in current CLI:

- PDF import/conversion
- Browser cookie extraction (Firefox/Chromium)
- `--cookie` option
- `--pdf-url` option
