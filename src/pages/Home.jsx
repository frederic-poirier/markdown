import { For, Show, createSignal } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import Ellipsis from 'lucide-solid/icons/ellipsis';
import Upload from 'lucide-solid/icons/upload';
import { toast } from 'solid-sonner';
import { useAuth } from '../context/AuthContext.jsx';
import { useFiles } from '../context/FilesContext.jsx';
import { useModal } from '../components/ui/Modal.jsx';
import { getSizePlaceholder, getTimeBetween, useNow } from '../utils/useMesure.js';
import { ToggleButton } from '../components/ui/ToggleButton.jsx';
import CloudUpload from 'lucide-solid/icons/cloud-upload';
import { Selectable } from '../components/ui/Selectable.jsx';
import { SelectionProvider, useSelection } from "../context/SelectionContext.jsx"
import {
  getDisplayName,
  getFileRouteFromFile,
  getInputAcceptValue,
  isProbablyTextFile,
  resolveFileMode
} from '../utils/fileMode.js';

export default function Home() {
  const { user } = useAuth();
  const {
    localFiles,
    cloudFiles,
    cloudIds,
    addFileOptimistic,
    removeLocalOptimistic,
    setCloudSyncOptimistic
  } = useFiles();

  const [selectedFile, setSelectedFile] = createSignal(null);
  const { Modal, toggleModal } = useModal();
  const selection = useSelection()

  const openFileMenu = (event, file) => {
    setSelectedFile(file);
    toggleModal(event);
  };

  const localFilesWithoutCloudFiles = () =>
    localFiles().filter((f) => !cloudIds().has(f.id))



  return (

    <section class="space-y-6 relative">
      <header class="flex justify-between items-center">
        <h1>Files</h1>
        <InputFile addFileOptimistic={addFileOptimistic} />
      </header>

      <section class="space-y-2">
        <h2 class="text-sm font-medium text-neutral-600 uppercase tracking-wide">Local</h2>
        <FileList files={localFilesWithoutCloudFiles()} handleClick={openFileMenu} emptyText="No local files" />
      </section>

      <section class="space-y-2">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-medium text-neutral-600 uppercase tracking-wide">Cloud</h2>
          <Show when={!user()}>
            <A href="/login" class="text-xs text-neutral-600 underline">Login to sync</A>
          </Show>
        </div>
        <FileList files={cloudFiles()} handleClick={null} emptyText="No cloud files" />
      </section>

      <Modal>
        <FileMenu
          file={selectedFile}
          cloudIds={cloudIds}
          canSync={Boolean(user())}
          removeLocalOptimistic={removeLocalOptimistic}
          setCloudSyncOptimistic={setCloudSyncOptimistic}
        />
      </Modal>
      <Show when={selection.hasSelection()}>
        <div class="fixed bottom-4 w-60 bg-neutral-100 border border-neutral-200 rounded-xl p-2 starting:opacity-0 starting:scale-95 opacity-100 scale-100 transition-all ease-out duration-300">
          <ul>
            <li>Delete all</li>
            <li>Sync all</li>
            <li>Unsync all</li>
            <li>Open all</li>
          </ul>
        </div>
      </Show>
    </section>
  );
}

function FileList(props) {
  return (
    <ul class="divide-y divide-neutral-200">
      <Show when={props.files?.length} fallback={<li class="py-3 text-sm text-neutral-600">{props.emptyText}</li>}>
        <For each={props.files}>
          {(file) => (
            <FileCard file={file} handleClick={props.handleClick} />
          )}
        </For>
      </Show>
    </ul>
  );
}

function FileMenu(props) {
  const isSynced = () => {
    const selected = props.file();
    if (!selected) return false;
    return props.cloudIds().has(selected.id);
  };

  const handleLocalRemoval = async () => {
    const selected = props.file();
    if (!selected) return;

    try {
      await props.removeLocalOptimistic(selected.id);
    } catch {
      toast.error('Local deletion failed');
    }
  };

  const handleSyncChange = async (event) => {
    const selected = props.file();
    if (!selected || !props.canSync) return;

    try {
      await props.setCloudSyncOptimistic(selected.id, event.currentTarget.checked);
    } catch {
      event.currentTarget.checked = !event.currentTarget.checked;
      toast.error('Cloud sync failed');
    }
  };

  return (
    <Show when={props.file()} fallback="No file selected">
      <div class="flex p-1 flex-col *:hover:bg-neutral-200 *:not-[hr]:p-1 *:cursor-pointer *:not-[hr]:rounded-lg *:text-left *:w-full">
        <ul class="flex gap-2 justify-between">
          <li>
            <ToggleButton state={isSynced} onClick={handleSyncChange}>
              <CloudUpload size={24} />
              Sync
            </ToggleButton>
          </li>
        </ul>
        <hr class="p-0 rounded-none text-neutral-200" />
        <A href={getFileRouteFromFile(props.file())}>Open</A>
        <a href={getFileRouteFromFile(props.file())} target="_blank">Open in a new tab</a>
        <label class="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-neutral-200">
          Sync with cloud
          <input
            type="checkbox"
            class="sr-only"
            checked={isSynced()}
            disabled={!props.canSync}
            onChange={handleSyncChange}
          />
          <Checkbox position={true} checked={isSynced()} />
        </label>
        <hr class="p-0 rounded-none text-neutral-200" />
        <button onClick={handleLocalRemoval}>Delete the file</button>
      </div>
    </Show>
  );
}

function FileCard(props) {
  const now = useNow();
  const hasMenu = () => typeof props.handleClick === 'function';

  const selection = useSelection()
  const isSelected = (id) => selection.isSelected(id)

  return (
    <Selectable id={props.file.id}>
      <li
        class="flex gap-2 first:rounded-t-lg last:rounded-b-lg"
        classList={{ "bg-neutral-100 select-none": isSelected(props.file.id) }}>
        <A
          href={getFileRouteFromFile(props.file)}
          class="
        grid grid-cols-[1fr_auto] sm:grid-cols-[3fr_1fr_1fr] gap-2 items-center
        *:text-neutral-500 py-2 w-full hover:*:text-neutral-950 focus:*:text-neutral-950
      "
        >
          <h3 class="font-medium">{getDisplayName(props.file.name)}</h3>
          <p class="hidden sm:block">
            {getTimeBetween(props.file.createdAt, now())}
          </p>
          <p class="hidden sm:block">
            {getSizePlaceholder(props.file.size)}
          </p>
        </A>
        <Show when={hasMenu()}>
          <button onClick={(e) => props.handleClick(e, props.file)} class="text-neutral-500 hover:text-neutral-950 focus:text-neutral-950 cursor-pointer">
            <Ellipsis />
          </button>
        </Show>
      </li>
    </Selectable>
  );
}



function InputFile(props) {
  const navigate = useNavigate();
  const handleFile = (event) => {
    const file = event.target.files[0];

    if (file) {
      if (!isProbablyTextFile(file)) {
        toast.error(`Unsupported file type for ${file.name}. Only text files are supported for now.`);
        return;
      }

      const reader = new FileReader();
      const mode = resolveFileMode(file.name);

      reader.onload = async function (e) {
        const content = e.target.result;

        if (typeof content !== 'string') {
          toast.error(`Error while reading file ${file.name}`);
          return;
        }

        try {
          const { id, alreadyExist } = await props.addFileOptimistic({
            name: file.name,
            content,
            sourceFormat: mode.sourceFormat,
            renderMode: mode.renderMode
          });

          const destination = getFileRouteFromFile({
            id,
            name: file.name,
            renderMode: mode.renderMode
          });

          if (alreadyExist) {
            toast('File already stored', {
              action: {
                label: `Open ${file.name}`,
                onClick: () => navigate(destination)
              }
            });
            return;
          }

          navigate(destination);
        } catch {
          toast.error(`Error while storing file ${file.name}`);
        }
      };

      reader.onerror = function () {
        toast.error(`Error while reading file ${file.name}`);
      };

      reader.readAsText(file, 'UTF-8');
    }
  };

  return (
    <label class="flex gap-2 items-center text-neutral-500 text-sm bg-neutral-100 rounded-lg px-2 py-1 cursor-pointer">
      Add file
      <Upload size={14} />
      <input
        class="appearance-none sr-only"
        type="file"
        accept={getInputAcceptValue()}
        onInput={handleFile}
      />

    </label>
  );
}


