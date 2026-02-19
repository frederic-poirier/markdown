# TODO

## 1) New viewer routes

- [x] Add route `/text/:id` (current reading experience, refined for text-first content)
- [x] Add route `/code/:id` (full-screen code viewer, no boxed card layout)
- [x] Add route `/media/:id` (canvas-like full-screen media view)
- [x] Keep route compatibility with existing `/view/:id` (redirect or fallback strategy)

## 2) Rendering modes

### Text mode (`/text`)
- [x] Keep current markdown reader behavior as baseline
- [x] Ensure title + description reflect the file name
- [x] Preserve readability defaults (spacing, typography, links, lists)

### Code mode (`/code`)
- [x] Full-screen code layout (remove boxy container feeling)
- [x] Keep syntax highlighting and copy action
- [ ] Improve long-line handling and horizontal navigation
- [x] Add language label and lightweight controls

### Media mode (`/media`)
- [ ] Full-screen render for Mermaid diagrams
- [ ] Full-screen render for images (zoom/pan-ready surface)
- [ ] Add neutral background and centered canvas behavior
- [ ] Define fallback UI when content is not media-friendly

## 3) New content input methods

- [ ] Add paste input flow (quick create from clipboard text)
- [ ] Add website URL input flow (fetch + convert/render text source)
- [ ] Reuse existing file identity/hash strategy when possible

## 4) Ingestion expansion (near-term)

- [ ] Add drag & drop file import
- [ ] Add API-based ingestion endpoint(s)
- [x] Add support for additional code-oriented file formats

## 5) Later phase (Cloudflare integration)

- [ ] Plan PDF ingestion via Cloudflare pipeline (extract/convert)
- [ ] Plan DOCX ingestion via Cloudflare pipeline (extract/convert)
- [ ] Define async processing status model for heavy conversions

## 6) UX and architecture guardrails

- [x] Keep local/cloud file model consistent across all new routes
- [x] Ensure route-specific rendering is mode-driven, not duplicated logic
- [ ] Keep auth requirements explicit for cloud features
- [ ] Keep APIs minimal and predictable (`files`, `ingest`, `render-mode`)

## 7) Suggested implementation order

1. Route split (`/text`, `/code`, `/media`)
2. Mode-specific layout/render components
3. Paste + URL ingestion
4. Drag & drop ingestion
5. API ingestion
6. Extra code formats
7. PDF/DOCX via Cloudflare
