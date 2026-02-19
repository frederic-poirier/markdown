const badgeCache = new Map()

export async function getBadgeData(url) {
    const svg = await getBadgeSVG(url)
    return parseSvg(svg)
}

async function getBadgeSVG(url) {
    if (badgeCache.has(url)) return badgeCache.get(url)
    const svg = await fetchBadgeSVG(url)
    badgeCache.set(url, svg)
    return svg
}

async function fetchBadgeSVG(url) {
    const proxy = `/api/badge?url=${encodeURIComponent(url)}`

    try {
        const response = await fetch(proxy)
        if (!response.ok) throw new Error("Proxy fetch failed")
        return await response.text()
    } catch {
        const response = await fetch(url)
        if (!response.ok) throw new Error("Direct fetch failed")
        return await response.text()
    }
}

function parseSvg(svgText) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgText, "image/svg+xml")

    const title = doc.querySelector("title")?.textContent?.trim()

    const aria = doc.documentElement.getAttribute("aria-label")?.trim()
    if (aria) {
        const parsed = splitLabelValue(aria, doc)
        if (parsed) return { doc, ...parsed }
    }

    if (title) {
        const parsed = splitLabelValue(title, doc)
        if (parsed) return { doc, ...parsed }
    }

    const nodes = [
        ...doc.querySelectorAll("text"),
        ...doc.querySelectorAll("tspan")
    ]

    const unique = [...new Set(
        nodes.map(n => n.textContent?.trim()).filter(Boolean)
    )]



    if (unique.length >= 2) {
        return {
            doc,
            logo: extractLogo(doc),
            label: unique[0],
            value: unique[1]
        }
    }

    return { doc, logo: extractLogo(doc), label: null, value: null }
}


function splitLabelValue(str, doc) {
    const separators = [":", " - "]

    for (const sep of separators) {
        if (str.includes(sep)) {
            const parts = str.split(sep)
            return {
                logo: extractLogo(doc),
                label: parts[0].trim(),
                value: parts.slice(1).join(sep).trim()
            }
        }
    }

    return null
}

function extractLogo(doc) {
    const image = doc.querySelector("image")
    if (!image) return null

    const href =
        image.getAttribute("href") ||
        image.getAttribute("xlink:href")

    if (!href?.startsWith("data:image/svg+xml;base64,")) {
        return null
    }

    const base64 = href.split(",")[1]
    const decoded = atob(base64)

    return decoded // ← SVG string du logo
}
