# Markdown Viewer - Todo Checklist

## UI/UX Improvements

- [ ] **Style Checklist Component**
  - [ ] Custom checkbox styling for task lists
  - [ ] Better visual hierarchy for checkboxes
  - [ ] Interactive state (check/uncheck with persistence)
  - [ ] Smooth animations on state change

- [ ] **Global Sidebar State**
  - [ ] Create a global store/context for sidebar state
  - [ ] Add toggle button in header/toolbar
  - [ ] Persist sidebar open/closed state in localStorage
  - [ ] Animate sidebar collapse/expand
  - [ ] Mobile responsive (hide by default on mobile)

- [ ] **Cmd+K Keyboard Shortcut**
  - [ ] Implement command palette component
  - [ ] Quick file search and navigation
  - [ ] Keyboard navigation (arrow keys, enter, escape)
  - [ ] Recent files quick access
  - [ ] Command suggestions/actions

## Content Management

- [ ] **Better "Add New" Document**
  - [ ] Pre-defined templates (blank, meeting notes, daily log, etc.)
  - [ ] Inline title input before creating
  - [ ] Quick create with timestamped filename
  - [ ] Create in specific folder/subdirectory
  - [ ] Duplicate existing file option

- [ ] **Provider Integrations**
  - [ ] **GitHub Integration**
    - [ ] OAuth authentication
    - [ ] Browse GitHub repositories
    - [ ] Import files from repos
    - [ ] Sync changes back to GitHub
  - [ ] **Google Drive Integration**
    - [ ] Google OAuth
    - [ ] Browse Drive folders
    - [ ] Import markdown files
    - [ ] Auto-sync capabilities
  - [ ] **Dropbox Integration**
    - [ ] Dropbox OAuth
    - [ ] Similar file browsing/import

- [ ] **Enhanced Paste Feature**
  - [ ] Handle raw markdown text
  - [ ] Handle formatted text (convert from rich text)
  - [ ] Handle HTML paste (convert to markdown)
  - [ ] Handle URL paste (fetch and convert page)
  - [ ] Smart paste detection (auto-detect format)
  - [ ] Preview before saving
  - [ ] Option to save as new file or temp preview

## Additional Features

- [ ] **File Organization**
  - [ ] Create folders/subdirectories
  - [ ] Move files between folders
  - [ ] Drag and drop organization
  - [ ] Favorite/star important files
  - [ ] Tags/labels system

- [ ] **Editor Features**
  - [ ] Built-in markdown editor (not just viewer)
  - [ ] Split view: edit + preview
  - [ ] Vim/Emacs keybinding support
  - [ ] Auto-save drafts
  - [ ] Find and replace

- [ ] **Search & Discovery**
  - [ ] Full-text search within files
  - [ ] Search in file content, not just titles
  - [ ] Search filters (by date, folder, tags)
  - [ ] Recent searches

- [ ] **Export & Sharing**
  - [ ] Export as PDF
  - [ ] Export as HTML
  - [ ] Copy shareable link
  - [ ] Generate static site
  - [ ] Print-friendly styles

- [ ] **Collaboration**
  - [ ] Comments on documents
  - [ ] Version history
  - [ ] Compare different versions
  - [ ] Real-time collaboration (websockets)

- [ ] **Theming**
  - [ ] Light/dark mode toggle
  - [ ] Custom accent colors
  - [ ] Font size controls
  - [ ] Line width settings
  - [ ] Syntax highlighting themes

- [ ] **Performance**
  - [ ] Virtual scrolling for large files list
  - [ ] Lazy loading of file content
  - [ ] Cache processed markdown
  - [ ] Incremental search indexing

- [ ] **Mobile Experience**
  - [ ] Touch-friendly sidebar
  - [ ] Swipe gestures
  - [ ] Optimized mobile layout
  - [ ] Offline support (PWA)

## In Progress
- [x] Move files to separate directory
- [x] Gitignore files directory
- [x] Update server to use files directory

## Completed
- [x] Basic markdown rendering
- [x] File sidebar
- [x] Recent files
- [x] File upload
- [x] Paste markdown
- [x] Hot reload
- [x] Solid Router integration
