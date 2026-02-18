import localforage from "localforage";
import { hashContent } from "../utils/hashContent";
import { toast } from "solid-sonner";
import { useNavigate } from "@solidjs/router";

const store = localforage.createInstance({
  name: "md",
  storeName: "files"
})

const INDEX_KEY = "__files_index__"

async function getIndex() {
  return (await store.getItem(INDEX_KEY)) || []
}

async function setIndex(index) {
  await store.setItem(INDEX_KEY, index)
}

export async function addFile(file) {
  const { id, size } = await hashContent(file.content)

  const alreadyExist = await getFile(id)
  if (alreadyExist) return { id, alreadyExist: true }

  const entry = {
    id,
    name: file.name,
    content: file.content,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  await store.setItem(id, entry)
  const index = await getIndex()
  index.push({
    id,
    name: file.name,
    size,
    createdAt: entry.createdAt
  })
  await setIndex(index)

  return { id, alreadyExist: false }
}

export async function getFile(id) {
  return await store.getItem(id)
}

export async function removeFile(id) {
  await store.removeItem(id)

  const index = await getIndex()
  const updated = index.filter(f => f.id !== id)
  await setIndex(updated)
}

export async function getFilesMetadata() {
  return await getIndex()
}  
