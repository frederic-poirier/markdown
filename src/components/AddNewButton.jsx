import { createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { Dropdown, DropdownItem, DropdownSeparator, Modal } from './ui/Modal.jsx';
import { PlusIcon, PasteIcon, UploadIcon } from './Icons.jsx';

export function AddNewButton(props) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = createSignal(false);
  const [activeModal, setActiveModal] = createSignal(null);

  const openModal = (type) => {
    setIsDropdownOpen(false);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handlePasteSubmit = async (content) => {
    const response = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: content })
    });
    
    if (!response.ok) {
      throw new Error('Failed to process markdown');
    }
    
    const data = await response.json();
    // Store the AST in session storage to display in preview
    sessionStorage.setItem('pastedMarkdown', JSON.stringify(data.hast));
    navigate('/preview');
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    props.onUpload?.();
    navigate(`/${data.path}`);
  };

  return (
    <>
      <div class="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen())}
          class="w-full flex items-center gap-2 px-3 py-2 bg-[#222] hover:bg-[#2a2a2a] text-[#ccc] text-sm font-medium rounded-lg transition-colors border border-[#333]"
        >
          <PlusIcon size={16} />
          <span>Add New</span>
        </button>

        <Dropdown isOpen={isDropdownOpen()} onClose={() => setIsDropdownOpen(false)}>
          <DropdownItem 
            icon={<PasteIcon size={16} />}
            onClick={() => openModal('paste')}
          >
            Paste Markdown
          </DropdownItem>
          <DropdownItem 
            icon={<UploadIcon size={16} />}
            onClick={() => openModal('upload')}
          >
            Upload File
          </DropdownItem>
        </Dropdown>
      </div>

      <PasteModal 
        isOpen={activeModal() === 'paste'} 
        onClose={closeModal}
        onSubmit={handlePasteSubmit}
      />

      <UploadModal 
        isOpen={activeModal() === 'upload'} 
        onClose={closeModal}
        onUpload={handleUpload}
      />
    </>
  );
}

function PasteModal(props) {
  const [content, setContent] = createSignal('');
  const [error, setError] = createSignal(null);
  const [submitting, setSubmitting] = createSignal(false);

  const handleSubmit = async () => {
    const text = content().trim();
    if (!text) {
      setError('Please enter some markdown content');
      return;
    }

    setSubmitting(true);
    try {
      await props.onSubmit(text);
      setContent('');
      setError(null);
      props.onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Paste Markdown"
      footer={
        <>
          <button
            onClick={props.onClose}
            class="px-4 py-2 text-sm text-[#666] hover:text-[#999] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!content().trim() || submitting()}
            class="px-4 py-2 bg-[#333] hover:bg-[#444] disabled:opacity-50 disabled:cursor-not-allowed text-[#e0e0e0] text-sm font-medium rounded-lg transition-colors"
          >
            {submitting() ? 'Processing...' : 'Preview'}
          </button>
        </>
      }
    >
      <div class="space-y-4">
        <p class="text-sm text-[#666]">
          Paste your markdown content below to preview it.
        </p>
        <textarea
          value={content()}
          onInput={(e) => {
            setContent(e.currentTarget.value);
            setError(null);
          }}
          placeholder="# Your markdown here..."
          class="w-full h-48 bg-[#111] text-[#ccc] text-sm font-mono leading-relaxed p-4 rounded-lg border border-[#333] focus:border-[#444] focus:outline-none resize-y placeholder:text-[#444]"
          spellcheck={false}
        />
        {error() && <p class="text-sm text-red-400">{error()}</p>}
      </div>
    </Modal>
  );
}

function UploadModal(props) {
  const [isDragging, setIsDragging] = createSignal(false);
  const [error, setError] = createSignal(null);
  let fileInputRef;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files?.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown') && !file.name.endsWith('.txt')) {
      setError('Please select a markdown file (.md, .markdown, .txt)');
      return;
    }

    try {
      await props.onUpload(file);
      setError(null);
      props.onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title="Upload Markdown File"
    >
      <div class="space-y-4">
        <p class="text-sm text-[#666]">
          Drag and drop a markdown file, or click to browse.
        </p>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef?.click()}
          class={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragging() 
              ? 'border-[#666] bg-[#222]/50' 
              : 'border-[#333] hover:border-[#444] bg-[#111]'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            onChange={handleFileSelect}
            class="hidden"
          />
          <div class="space-y-2">
            <svg class="mx-auto h-12 w-12 text-[#444]" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div class="text-sm text-[#666]">
              <span class="font-medium text-[#999]">Click to upload</span> or drag and drop
            </div>
            <p class="text-xs text-[#444]">Markdown files (.md, .markdown, .txt)</p>
          </div>
        </div>
        {error() && <p class="text-sm text-red-400">{error()}</p>}
      </div>
    </Modal>
  );
}
