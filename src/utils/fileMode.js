const CODE_EXTENSIONS = new Set([
    'c', 'cc', 'cpp', 'cs', 'css', 'go', 'h', 'hpp', 'html', 'java', 'js', 'jsx',
    'kt', 'lua', 'm', 'php', 'pl', 'py', 'r', 'rb', 'rs', 'scala', 'sh', 'sql',
    'swift', 'ts', 'tsx', 'vue', 'xml', 'yaml', 'yml'
]);

const TEXT_EXTENSIONS = new Set([
    'csv', 'env', 'ini', 'log', 'markdown', 'md', 'mdx', 'txt', 'toml'
]);

const MEDIA_EXTENSIONS = new Set([
    'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'
]);

const KNOWN_BINARY_EXTENSIONS = new Set([
    '7z', 'avi', 'bmp', 'doc', 'docx', 'exe', 'ico', 'mov', 'mp3', 'mp4', 'odt',
    'pdf', 'ppt', 'pptx', 'rar', 'tar', 'webm', 'xls', 'xlsx', 'zip'
]);

const DEFAULT_MODE = 'text';

export function getExtensionFromName(name) {
    if (typeof name !== 'string') return '';

    const trimmed = name.trim();
    const lastDot = trimmed.lastIndexOf('.');

    if (lastDot < 0 || lastDot === trimmed.length - 1) {
        return '';
    }

    return trimmed.slice(lastDot + 1).toLowerCase();
}

export function getDisplayName(name) {
    if (typeof name !== 'string' || name.trim().length === 0) {
        return 'Untitled';
    }

    const trimmed = name.trim();
    const extension = getExtensionFromName(trimmed);
    if (!extension) return trimmed;

    return trimmed.slice(0, -(extension.length + 1));
}

export function resolveFileMode(name) {
    const extension = getExtensionFromName(name);

    if (!extension) {
        return {
            extension: '',
            sourceFormat: 'plain',
            renderMode: DEFAULT_MODE
        };
    }

    if (MEDIA_EXTENSIONS.has(extension)) {
        return {
            extension,
            sourceFormat: extension,
            renderMode: 'media'
        };
    }

    if (CODE_EXTENSIONS.has(extension)) {
        return {
            extension,
            sourceFormat: extension,
            renderMode: 'code'
        };
    }

    return {
        extension,
        sourceFormat: extension,
        renderMode: DEFAULT_MODE
    };
}

export function resolveRenderMode(file) {
    if (file?.renderMode === 'code' || file?.renderMode === 'media' || file?.renderMode === 'text') {
        return file.renderMode;
    }

    return resolveFileMode(file?.name).renderMode;
}

export function getFileRoute(id, mode) {
    const normalizedMode = mode === 'code' || mode === 'media' ? mode : 'text';
    return `/${normalizedMode}/${id}`;
}

export function getFileRouteFromFile(file) {
    if (!file?.id) return '/';
    return getFileRoute(file.id, resolveRenderMode(file));
}

export function getCodeLanguage(name) {
    const extension = getExtensionFromName(name);
    if (!extension) return 'text';
    if (extension === 'md' || extension === 'markdown') return 'markdown';
    if (extension === 'yml') return 'yaml';
    return extension;
}

export function isProbablyTextFile(file) {
    const extension = getExtensionFromName(file?.name || '');
    const mimeType = typeof file?.type === 'string' ? file.type.toLowerCase() : '';

    if (KNOWN_BINARY_EXTENSIONS.has(extension)) return false;

    if (!mimeType) {
        return true;
    }

    if (mimeType.startsWith('text/')) return true;
    if (mimeType.includes('json')) return true;
    if (mimeType.includes('xml')) return true;
    if (mimeType.includes('javascript')) return true;
    if (mimeType.includes('typescript')) return true;
    if (mimeType.includes('yaml')) return true;

    return !mimeType.startsWith('image/') && !mimeType.startsWith('video/') && !mimeType.startsWith('audio/');
}

export function getInputAcceptValue() {
    const codeValues = [...CODE_EXTENSIONS].map((extension) => `.${extension}`);
    const textValues = [...TEXT_EXTENSIONS].map((extension) => `.${extension}`);

    return [
        ...new Set([
            ...codeValues,
            ...textValues,
            'text/*',
            'application/json',
            'application/xml'
        ])
    ].join(',');
}
