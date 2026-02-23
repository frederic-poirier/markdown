# Changes Since Last Commit

Generated: 2026-02-21T17:23:23-05:00  
Baseline commit (HEAD): `28c21626315c78e631129db6f59da30426ff5607`  
Baseline commit date: `2026-02-21 14:32:29 -0500`

## Summary

- Tracked file updates: **34** files changed (`572` insertions, `2115` deletions)
- Working tree status counts:
  - `M`: 19 modified
  - `D`: 15 deleted
  - `??`: 10 untracked

## Tracked Changes (vs HEAD)

| Status | Path | + | - |
|---|---|---:|---:|
| D | `functions/api/pdf/[[path]].js` | 0 | 188 |
| M | `functions/auth/callback.js` | 15 | 3 |
| M | `functions/utils/auth/authenticate.js` | 1 | 2 |
| M | `functions/utils/db/filesR2.js` | 113 | 63 |
| M | `functions/utils/db/users.js` | 3 | 3 |
| M | `schema.sql` | 4 | 0 |
| D | `services/marker-bridge/README.md` | 0 | 92 |
| D | `services/marker-bridge/__pycache__/app.cpython-314.pyc` | binary | binary |
| D | `services/marker-bridge/app.py` | 0 | 157 |
| D | `services/marker-bridge/requirements.txt` | 0 | 4 |
| M | `src/App.jsx` | 0 | 2 |
| M | `src/components/ui/Modal.jsx` | 4 | 2 |
| M | `src/context/AuthContext.jsx` | 3 | 20 |
| M | `src/context/FilesContext.jsx` | 168 | 12 |
| D | `src/context/SelectionContext.jsx` | 0 | 128 |
| M | `src/db/cloudFile.js` | 38 | 56 |
| D | `src/db/file.js` | 0 | 129 |
| D | `src/db/pdfImport.js` | 0 | 75 |
| M | `src/index.css` | 36 | 64 |
| M | `src/index.jsx` | 1 | 2 |
| M | `src/markdown/renderers/ElementBlock/Image.jsx` | 18 | 42 |
| M | `src/markdown/renderers/ElementBlock/Table.jsx` | 64 | 3 |
| D | `src/pages/AuthSuccess.jsx` | 0 | 7 |
| M | `src/pages/CodeView.jsx` | 2 | 2 |
| M | `src/pages/Home.jsx` | 91 | 276 |
| M | `src/pages/MediaView.jsx` | 2 | 2 |
| M | `src/pages/TextView.jsx` | 2 | 2 |
| D | `src/styles/syntax-highlight.css` | 0 | 145 |
| D | `src/utils/domProps.js` | 0 | 32 |
| D | `src/utils/elementProps.js` | 0 | 126 |
| D | `src/utils/parser.js` | 0 | 23 |
| D | `src/utils/useBadge.js` | 0 | 103 |
| D | `src/utils/useFilesStore.js` | 0 | 345 |
| M | `wrangler.jsonc` | 7 | 5 |

## Untracked Files

| Status | Path |
|---|---|
| ?? | `docs/audit-cloud-first-2026-02-21.md` |
| ?? | `docs/changes-since-last-commit-2026-02-21.md` |
| ?? | `functions/api/file/[id].js` |
| ?? | `functions/api/file/all.js` |
| ?? | `src/api/files.js` |
| ?? | `src/data/filesStore.js` |
| ?? | `src/markdown/renderers/ElementBlock/Badge.jsx` |
| ?? | `src/styles/base.css` |
| ?? | `src/styles/index.css` |
| ?? | `src/styles/shiki.css` |

## Raw Git Outputs

```bash
git diff --stat HEAD
```

```text
 functions/api/pdf/[[path]].js                      | 188 -----------
 functions/auth/callback.js                         |  18 +-
 functions/utils/auth/authenticate.js               |   3 +-
 functions/utils/db/filesR2.js                      | 176 ++++++----
 functions/utils/db/users.js                        |   6 +-
 schema.sql                                         |   4 +
 services/marker-bridge/README.md                   |  92 ------
 .../marker-bridge/__pycache__/app.cpython-314.pyc  | Bin 8946 -> 0 bytes
 services/marker-bridge/app.py                      | 157 ---------
 services/marker-bridge/requirements.txt            |   4 -
 src/App.jsx                                        |   2 -
 src/components/ui/Modal.jsx                        |   6 +-
 src/context/AuthContext.jsx                        |  23 +-
 src/context/FilesContext.jsx                       | 180 +++++++++-
 src/context/SelectionContext.jsx                   | 128 -------
 src/db/cloudFile.js                                |  94 +++---
 src/db/file.js                                     | 129 --------
 src/db/pdfImport.js                                |  75 -----
 src/index.css                                      | 100 ++----
 src/index.jsx                                      |   3 +-
 src/markdown/renderers/ElementBlock/Image.jsx      |  60 +---
 src/markdown/renderers/ElementBlock/Table.jsx      |  67 +++-
 src/pages/AuthSuccess.jsx                          |   7 -
 src/pages/CodeView.jsx                             |   4 +-
 src/pages/Home.jsx                                 | 367 +++++----------------
 src/pages/MediaView.jsx                            |   4 +-
 src/pages/TextView.jsx                             |   4 +-
 src/styles/syntax-highlight.css                    | 145 --------
 src/utils/domProps.js                              |  32 --
 src/utils/elementProps.js                          | 126 -------
 src/utils/parser.js                                |  23 --
 src/utils/useBadge.js                              | 103 ------
 src/utils/useFilesStore.js                         | 345 -------------------
 wrangler.jsonc                                     |  12 +-
 34 files changed, 572 insertions(+), 2115 deletions(-)
```
