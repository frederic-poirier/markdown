export async function onRequestGet(context) {
  const { request, env } = context
  const { searchParams } = new URL(request.url)
  const badgeUrl = searchParams.get("url")

  if (!badgeUrl) {
    return new Response("Missing url", { status: 400 })
  }

  const cacheKey = new Request(badgeUrl, request)
  const cache = caches.default

  let response = await cache.match(cacheKey)
  if (response) return response

  const upstream = await fetch(badgeUrl, {
    headers: { "User-Agent": "badge-proxy" }
  })

  if (!upstream.ok) {
    return new Response("Upstream fetch failed", { status: 500 })
  }

  const svg = await upstream.text()

  response = new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400"
    }
  })

  context.waitUntil(cache.put(cacheKey, response.clone()))

  return response
}
