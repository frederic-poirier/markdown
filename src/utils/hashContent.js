export async function hashContent(content) {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const size = data.length
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const id = hashArray
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")

  return { id, size }
}
