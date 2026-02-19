import { getFile } from "./file";
import { resolveFileMode } from '../utils/fileMode.js';

async function parseJson(response) {
    try {
        return await response.json();
    } catch {
        return null;
    }
}

export async function getCloudFilesMetadata() {
    const response = await fetch('/api/files/all');

    if (response.status === 401) return [];

    if (!response.ok) throw new Error('Failed to fetch cloud files');

    const data = await parseJson(response);
    return Array.isArray(data) ? data : [];
}

export async function getCloudFile(id) {
    if (!id) return null;

    const response = await fetch(`/api/files/${encodeURIComponent(id)}`);

    if (response.status === 401 || response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error('Failed to fetch cloud file');
    }

    return await parseJson(response);
}

export async function storeCloudFile(file) {
    if (!file?.id || !file?.name) {
        throw new Error('Invalid file payload');
    }

    const localFile = file?.content
        ? file
        : await getFile(file.id);

    const content = typeof localFile?.content === 'string' ? localFile.content : '';
    if (!content.trim()) {
        throw new Error('Cannot store cloud file without content');
    }

    const mode = resolveFileMode(file.name || localFile?.name);
    const response = await fetch(`/api/files/${encodeURIComponent(file.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: file.name,
            content,
            sourceFormat: file.sourceFormat || localFile?.sourceFormat || mode.sourceFormat,
            renderMode: file.renderMode || localFile?.renderMode || mode.renderMode
        })
    });

    if (!response.ok) {
        throw new Error('Failed to store cloud file');
    }

    return await parseJson(response);
}

export async function removeCloudFile(id) {
    if (!id) {
        throw new Error('id is required');
    }

    const response = await fetch(`/api/files/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error('Failed to remove cloud file');
    }

    return await parseJson(response);
}
