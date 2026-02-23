import { For, Show, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import Trash from 'lucide-solid/icons/trash-2';
import Upload from 'lucide-solid/icons/upload';
import { toast } from 'solid-sonner';
import { useFiles } from '../context/FilesContext.jsx';
import {
  BottomSheet,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetSnap
} from '../components/ui/BottomSheet.jsx';
import { getDisplayName, getFileRouteFromFile, getInputAcceptValue, isProbablyTextFile } from '../utils/fileMode.js';

export default function Home() {
  const { files, addFile, removeFile } = useFiles();

  return (
    <section class="space-y-4">
      <header class="flex justify-between items-center">
        <h1>Files</h1>
        <InputFile addFile={addFile} />
      </header>

      <FileList files={files()} isLoading={files.loading} onRemove={removeFile} />
    </section>
  );
}

function InputFile(props) {
  const [busy, setBusy] = createSignal(false);
  const [pastedContent, setPastedContent] = createSignal('');
  const [isSheetOpen, setIsSheetOpen] = createSignal(false);
  let inputRef;
  const pasteName = () => `pasted-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.md`;

  const importContent = async (name, content, errorMessage) => {
    try {
      setBusy(true);
      await props.addFile({ name, content });
      setPastedContent('');
      setIsSheetOpen(false);
    } catch {
      toast.error(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  const handleChange = async (event) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';

    if (!file) return;

    if (!isProbablyTextFile(file)) {
      toast.error('Only text files are supported for now');
      return;
    }

    const content = await file.text();
    await importContent(file.name, content, 'Upload failed');
  };

  const handleChooseFile = () => {
    setIsSheetOpen(false);
    inputRef?.click();
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        toast.error('Clipboard is empty');
        return;
      }

      setPastedContent((current) => {
        if (!current.trim()) return clipboardText;
        return `${current}\n${clipboardText}`;
      });
    } catch {
      toast.error('Unable to read clipboard');
    }
  };

  const handlePasteImport = async () => {
    const content = pastedContent();
    if (!content.trim()) {
      toast.error('Nothing to import. Paste clipboard content first.');
      return;
    }

    await importContent(pasteName(), content, 'Paste import failed');
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        class="sr-only"
        accept={getInputAcceptValue()}
        onChange={handleChange}
        disabled={busy()}
      />

      <button
        type="button"
        onClick={() => setIsSheetOpen(true)}
        disabled={busy()}
        class="flex items-center gap-2 px-2 py-1 text-sm text-neutral-600 rounded-lg bg-neutral-100 hover:text-neutral-950 hover:bg-neutral-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Upload size={12} />
        {busy() ? 'Uploading...' : 'Import'}
      </button>

      {isSheetOpen() && (
        <div class="fixed inset-0 z-50 bg-black/30" onClick={() => setIsSheetOpen(false)}>
          <BottomSheet
            class="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-2xl rounded-t-2xl bg-neutral-100 shadow-2xl"
            contentHeight
            nestedScroll
            onClick={(event) => event.stopPropagation()}
          >
            <BottomSheetSnap initial snap="96px" />
            <BottomSheetSnap snap="45vh" />
            <BottomSheetSnap snap="80vh" />

            <BottomSheetHeader>
              <div class="px-4 pt-3 pb-2 text-sm font-medium text-neutral-700">Import</div>
            </BottomSheetHeader>

            <div class="px-4 pb-3 space-y-3">
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleChooseFile}
                  disabled={busy()}
                  class="px-2 py-2 text-sm rounded-lg bg-neutral-50 hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Choose file
                </button>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  disabled={busy()}
                  class="px-2 py-2 text-sm rounded-lg bg-neutral-50 hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Paste from clipboard
                </button>
              </div>

              <pre class="max-h-56 overflow-auto rounded-lg border border-neutral-300 bg-white p-3 text-xs text-neutral-700 whitespace-pre-wrap break-words">
                {pastedContent().trim() ? pastedContent() : 'Clipboard preview will appear here.'}
              </pre>
            </div>

            <BottomSheetFooter>
              <div class="px-4 pb-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(false)}
                  disabled={busy()}
                  class="px-2 py-2 text-sm rounded-lg bg-neutral-200 hover:bg-neutral-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePasteImport}
                  disabled={busy()}
                  class="px-2 py-2 text-sm rounded-lg bg-neutral-900 text-white hover:bg-neutral-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Import pasted text
                </button>
              </div>
            </BottomSheetFooter>
          </BottomSheet>
        </div>
      )}
    </>
  );
}

function FileList(props) {
  return (
    <ul class="divide-y divide-neutral-200">
      <Show
        when={props.files?.length}
        fallback={
          <li class="py-3 text-sm text-neutral-600">
            {props.isLoading ? 'Loading...' : 'No cloud files'}
          </li>
        }
      >
        <For each={props.files}>
          {(file) => (
            <FileCard file={file} onRemove={props.onRemove} />
          )}
        </For>
      </Show>
    </ul>
  );
}

function FileCard(props) {
  const handleRemove = async () => {
    try {
      await props.onRemove(props.file.id);
    } catch {
      toast.error('Cloud deletion failed');
    }
  };

  return (
    <li class="flex items-center gap-2">
      <A
        href={getFileRouteFromFile(props.file)}
        class="grid grid-cols-[1fr_auto] gap-2 items-center py-2 w-full"
      >
        <h3 class="font-medium text-neutral-800">{getDisplayName(props.file.name)}</h3>
        <span class="text-xs text-neutral-500">{props.file.updatedAt ? new Date(props.file.updatedAt).toLocaleDateString() : ''}</span>
      </A>
      <button
        onClick={handleRemove}
        class="text-neutral-500 hover:text-neutral-900"
        aria-label="Delete file"
      >
        <Trash size={16} />
      </button>
    </li>
  );
}
