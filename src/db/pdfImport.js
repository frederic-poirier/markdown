import JSZip from 'jszip';

function toMarkdownName(fileName) {
    const safeName = typeof fileName === 'string' && fileName.trim().length > 0
        ? fileName.trim()
        : 'document.pdf';

    if (safeName.toLowerCase().endsWith('.pdf')) {
        return `${safeName.slice(0, -4)}.md`;
    }

    return `${safeName}.md`;
}

function findMarkdownEntry(zip, preferredName) {
    const preferred = zip.file(preferredName);
    if (preferred) return preferred;

    const entries = Object.values(zip.files);
    return entries.find((entry) => !entry.dir && entry.name.toLowerCase().endsWith('.md')) || null;
}

export async function importPdfAsMarkdown(file, options = {}) {
    if (!(file instanceof File)) {
        throw new Error('A PDF File is required');
    }

    const fast = Boolean(options.fast);
    const outputName = toMarkdownName(file.name);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('output_file', outputName);

    if (fast) {
        formData.append('fast', 'true');
    }

    const response = await fetch('/api/pdf/markdown', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const body = await response.text();
        let parsed = null;

        try {
            parsed = body ? JSON.parse(body) : null;
        } catch {
            parsed = null;
        }

        const reason = parsed?.detail || parsed?.error || body;
        throw new Error(reason || 'Failed to convert PDF');
    }

    const zipBuffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(zipBuffer);
    const markdownEntry = findMarkdownEntry(zip, outputName);

    if (!markdownEntry) {
        throw new Error('Converted markdown file not found in response archive');
    }

    const content = await markdownEntry.async('string');

    if (!content.trim()) {
        throw new Error('Converted markdown is empty');
    }

    return {
        name: outputName,
        content
    };
}
