import { addFile, getFilesMetadata, removeFile } from "../db/file.js";
import { getTimeBetween, getSizePlaceholder, useNow } from '../utils/useMesure.js'
import { createResource, createSignal } from "solid-js";
import { A, useNavigate } from "@solidjs/router"
import Ellipsis from "lucide-solid/icons/ellipsis";
import { toast } from "solid-sonner";
import Upload from "lucide-solid/icons/upload";
import { useModal } from "../components/ui/Modal.jsx";

export default function Home() {
  const [files, { refetch }] = createResource(getFilesMetadata)
  const [selectedFile, setSelectedFile] = createSignal(null)
  const { Modal, toggleModal } = useModal()

  const openFileMenu = (event, file) => {
    setSelectedFile(file)
    toggleModal(event)
  }

  return (
    <section class="space-y-3">
      <header class="flex justify-between items-center">
        <h1>Files</h1>
        <InputFile refetch={refetch} />
      </header>
      <ul class="divide-y divide-neutral-200">
        <For each={files()}>
          {(file) => (
            <FileCard
              file={file}
              handleClick={openFileMenu}
            />
          )}
        </For>
      </ul>
      <Modal>
        <FileMenu file={selectedFile} refetch={refetch} />
      </Modal>
    </section>
  )
}

function FileMenu(props) {

  const handleRemoval = () => {
    removeFile(props.file().id)
    props.refetch
  }

  return (
    <Show when={props.file()} fallback="No file selected">
      <div class="flex p-1 flex-col *:hover:bg-neutral-200 *:not-[hr]:p-1 *:cursor-pointer *:not-[hr]:rounded *:text-left *:w-full">
        <A href={`/view/${props.file().id}`}>Open</A>
        <a href={`/view/${props.file().id}`} target="_blank">Open in a new tab</a>
        <button onClick={() => storeFile(props.file())}>Store on cloud</button>
        <hr class="p-0 rounded-none text-neutral-200" />
        <button onClick={handleRemoval}>Delete the file</button>
      </div>
    </Show>
  )
}

function FileCard(props) {
  const now = useNow() // update now value every minute


  return (
    <li class="flex gap-2 *:rounded-lg">
      <A
        href={`/view/${props.file.id}`}
        class="
        grid grid-cols-[1fr_auto] sm:grid-cols-[3fr_1fr_1fr] gap-2 items-center
        *:text-neutral-500 py-2 w-full hover:*:text-neutral-950 focus:*:text-neutral-950
      "
      >
        <h3 class="font-medium">{props.file.name.replace(".md", "")}</h3>
        <p class="hidden sm:block">
          {getTimeBetween(props.file.createdAt, now())}
        </p>
        <p class="hidden sm:block">
          {getSizePlaceholder(props.file.size)}
        </p>
      </A>
      <button onClick={(e) => props.handleClick(e, props.file)} class="text-neutral-500 hover:text-neutral-950 focus:text-neutral-950 cursor-pointer">
        <Ellipsis />
      </button>
    </li>
  )
}



function InputFile(props) {
  const navigate = useNavigate()
  const handleFile = (event) => {
    const file = event.target.files[0]

    if (file) {
      const reader = new FileReader();

      reader.onload = async function (e) {
        const content = e.target.result;
        const { id, alreadyExist } = await addFile({ name: file.name, content })
        if (alreadyExist) {
          toast('File already stored', {
            action: {
              label: `Open ${alreadyExist.name}`,
              onClick: () => navigate(`/view/${id}`)
            }
          })
        }

        props.refetch()
      }

      reader.onerror = function () {
        toast.error(`Error while reading file ${file.name}`)
      }

      reader.readAsText(file, "UTF-8")
    }
  }

  return (
    <label class="flex gap-2 items-center text-neutral-500 text-sm bg-neutral-100 rounded-lg px-2 py-1 cursor-pointer">
      Add file
      <Upload size={14} />
      <input
        class="appearance-none sr-only"
        type="file"
        accept=".md"
        onInput={handleFile}
      />

    </label>
  )
}


