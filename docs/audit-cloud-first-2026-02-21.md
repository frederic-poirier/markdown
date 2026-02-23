# Cloud-First Simplification Audit (2026-02-21)

## Executive Summary
This repository has grown into a hybrid local+cloud Markdown viewer with multiple rendering modes, a PDF conversion pipeline, file-sync toggles, and several UI/UX layers that are not aligned with a cloud-first product vision. The current shape duplicates storage paths (IndexedDB + R2/D1), duplicates metadata logic, and mixes “viewer” and “library” responsibilities in ways that make the app harder to reason about and harder to simplify.

The new target is clear: cloud is the source of truth for a user’s library, with optional local save/pin later. For now, reduce the app to a minimal cloud-first library and viewer. This audit lists which modules are core, which are over-complex, and which should be removed or deferred.

## Current Architecture Overview

### Frontend
- `src/App.jsx`: Routes for Home + views (text/code/media) + auth flows.
- `src/pages/Home.jsx`: Library UI with Local and Cloud sections, file menu, and sync toggle.
- `src/pages/TextView.jsx`: Markdown to HAST rendering pipeline.
- `src/pages/CodeView.jsx`: Stub page (title/description only).
- `src/pages/MediaView.jsx`: Placeholder for media renderers.
- `src/context/AuthContext.jsx`: Auth state and OAuth popup handling.
- `src/context/FilesContext.jsx`: Wires `useFilesStore` to auth.
- `src/utils/useFilesStore.js`: Local + cloud store, optimistic syncing, and ID/content hashing.
- `src/db/file.js`: Local storage (IndexedDB via localforage).
- `src/db/cloudFile.js`: Cloud storage access via `/api/files` endpoints.
- `src/markdown/*`: Markdown parsing, HAST transforms, renderers (including gallery and code blocks).

### Backend (Cloudflare Pages Functions)
- Auth routes in `functions/auth/*` and helpers in `functions/utils/auth/*`.
- File API routes in `functions/api/files/*` with R2 + D1 (`functions/utils/db/filesR2.js`).
- PDF proxy in `functions/api/pdf/[[path]].js` (relies on external PDF service + Cloudflare Access).

### CLI
- `bin/texte-upload.js`: CLI uploader using session cookies and optional PDF service.

## Complexity Hotspots (Why They Conflict With Cloud-First)

### 1) Dual Storage Paths (Local + Cloud + Sync)
- `src/db/file.js`, `src/db/cloudFile.js`, and `src/utils/useFilesStore.js` maintain two sources of truth.
- Home UI renders Local and Cloud sections, and exposes a sync toggle to move between them.
- This directly conflicts with the target “cloud is primary” and adds large operational complexity.

Impact:
- Duplicate metadata logic (size, createdAt, renderMode, sourceFormat).
- Optimistic sync logic increases failure modes.
- Extra UI concepts (sync toggle, local list) dilute the library concept.

### 2) Overly Broad Rendering Surface
- Markdown pipeline includes custom rules (`galleryRule`, `codeBlockRule`) and extra renderers.
- Code rendering brings Shiki + Mermaid (heavy dependencies for a minimal viewer).
- Media mode exists but is not implemented (placeholder).

Impact:
- Larger bundle and more moving parts for a simple cloud library viewer.
- Harder to maintain consistency as features grow.

### 3) PDF Conversion Pipeline
- Proxy to a PDF service and a separate `services/marker-bridge` service.
- `src/db/pdfImport.js` handles zip conversion + markdown extraction.

Impact:
- Complex service dependencies that are not needed for the cloud-first library MVP.
- Difficult to debug or host with limited benefit at this stage.

### 4) Selection/Batch UI and File Menu Complexity
- `src/context/SelectionContext.jsx` supports drag selection with portal overlay.
- File menu supports local deletion and cloud syncing.

Impact:
- Adds interaction complexity that does not align with a simple library-first UX.

## Remove or Defer List (Recommended)

### Remove (now)
- Local storage implementation: `src/db/file.js` and related local-only flows.
- Local + sync UI in `src/pages/Home.jsx` (local list, sync toggle, local delete).
- Selection box UX: `src/context/SelectionContext.jsx` and its usage in `Home.jsx`.
- PDF conversion pipeline: `src/db/pdfImport.js`, `functions/api/pdf/[[path]].js`, `services/marker-bridge`.
- Media and code placeholder views if not actively used: `src/pages/MediaView.jsx`, `src/pages/CodeView.jsx`.

### Defer (later)
- Offline mode and IndexedDB cache (re-introduce as explicit “pin/download”).
- PWA-specific behavior and background sync (only after core cloud library is stable).

### Keep (core for cloud-first MVP)
- Auth flow: `functions/auth/*`, `functions/utils/auth/*`, `src/context/AuthContext.jsx`.
- Cloud file API: `functions/api/files/*`, `functions/utils/db/filesR2.js`.
- Cloud file client: `src/db/cloudFile.js`.
- Minimal markdown rendering: `src/markdown/parsers.js`, `src/markdown/renderHAST.jsx`, and essential renderers.

## Proposed Minimal Cloud-First Architecture

### Data Model
- Cloud file record (per user):
  - `id`, `name`, `content`, `updatedAt`, `renderMode`
  - Optional `sourceFormat` only if used by the renderer.

### UI / UX
- Single library list (cloud only).
- Import flow: user uploads file -> stored in cloud -> appears in library.
- File view: open by ID and render text in markdown view.

### Technical Flow (Simplified)
1. Login with OAuth (existing flow).
2. Upload file content to `/api/files/:id`.
3. List via `/api/files/all`.
4. Open file via `/text/:id` (Markdown viewer only).

## Migration and Compatibility Notes
- Removing local storage will break existing local-only files. Consider a one-time migration tool or banner to re-import local files into cloud.
- Removing PDF pipeline will disable existing PDF-to-markdown flow. This can be reintroduced later as a separate service.
- If code and media modes are removed, ensure `resolveFileMode` and routing either collapse to text-only or explicitly block those routes.

## Risks and Unknowns
- Users with local-only content will lose visibility if not migrated.
- Existing CLI (`texte-upload`) is aligned with cloud-first and should remain, but the API contract must stay stable.
- Auth and session refresh logic should be rechecked for correctness (current `authenticate.js` refresh logic uses `payload - now` instead of `payload.exp - now`).

## Actionable Simplification Steps (High Priority)
1. Remove local storage APIs and store only cloud files.
2. Collapse library UI to cloud-only list with import CTA.
3. Reduce markdown rendering surface to core elements needed for text view.
4. Delete or park unused features (PDF, media, code view, selection UI).

## Appendix: File/Module Map (Reference)
- Cloud-first core:
  - `functions/api/files/[id].js`
  - `functions/api/files/all.js`
  - `functions/utils/db/filesR2.js`
  - `src/db/cloudFile.js`
  - `src/pages/TextView.jsx`
  - `src/markdown/parsers.js`
  - `src/markdown/renderHAST.jsx`

- Candidates for removal:
  - `src/db/file.js`
  - `src/utils/useFilesStore.js` (replace with cloud-only store)
  - `src/context/SelectionContext.jsx`
  - `src/db/pdfImport.js`
  - `functions/api/pdf/[[path]].js`
  - `services/marker-bridge`
  - `src/pages/MediaView.jsx`
  - `src/pages/CodeView.jsx`
