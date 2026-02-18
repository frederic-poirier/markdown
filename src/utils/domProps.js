const TEXT_ALIGN_VALUES = new Set(['left', 'center', 'right', 'justify']);
const VERTICAL_ALIGN_VALUES = new Set(['top', 'middle', 'bottom', 'baseline']);

export function normalizeCssSize(size) {
    if (size === undefined || size === null || size === '') {
        return undefined;
    }

    if (typeof size === 'number') {
        return `${size}px`;
    }

    return String(size);
}

export function normalizeTextAlign(align) {
    if (!align) {
        return undefined;
    }

    const value = String(align).toLowerCase();
    return TEXT_ALIGN_VALUES.has(value) ? value : undefined;
}

export function normalizeVerticalAlign(vAlign) {
    if (!vAlign) {
        return undefined;
    }

    const value = String(vAlign).toLowerCase();
    return VERTICAL_ALIGN_VALUES.has(value) ? value : undefined;
}