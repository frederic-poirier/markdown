import { normalizeCssSize, normalizeTextAlign, normalizeVerticalAlign } from './domProps.js';

function toPositiveInteger(value) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 1) {
        return undefined;
    }

    return parsed;
}

function buildTableCellProps(rawProps) {
    const style = {};
    const align = normalizeTextAlign(rawProps.align);
    const vAlign = normalizeVerticalAlign(rawProps.vAlign);
    const width = normalizeCssSize(rawProps.width);
    const colSpan = toPositiveInteger(rawProps.colSpan);
    const rowSpan = toPositiveInteger(rawProps.rowSpan);

    if (align) {
        style['text-align'] = align;
    }

    if (vAlign) {
        style['vertical-align'] = vAlign;
    }

    if (width) {
        style.width = width;
    }

    const props = {};
    if (colSpan) {
        props.colSpan = colSpan;
    }

    if (rowSpan) {
        props.rowSpan = rowSpan;
    }

    if (Object.keys(style).length) {
        props.style = style;
    }

    return props;
}

function buildTableRowProps(rawProps) {
    const vAlign = normalizeVerticalAlign(rawProps.vAlign);

    if (!vAlign) {
        return {};
    }

    return {
        style: {
            'vertical-align': vAlign
        }
    };
}

function buildFigureProps(rawProps) {
    const align = normalizeTextAlign(rawProps.align);

    if (align === 'center') {
        return {
            style: {
                'margin-inline': 'auto'
            }
        };
    }

    if (align === 'right') {
        return {
            style: {
                'margin-left': 'auto'
            }
        };
    }

    return {};
}

function buildImageProps(rawProps) {
    const style = {};
    const width = normalizeCssSize(rawProps.width);
    const height = normalizeCssSize(rawProps.height);
    const vAlign = normalizeVerticalAlign(rawProps.vAlign);

    if (width) {
        style.width = width;
    }

    if (height) {
        style.height = height;
    }

    if (vAlign) {
        style['vertical-align'] = vAlign;
    }

    if (!Object.keys(style).length) {
        return {};
    }

    return { style };
}

export function applyElementProps(elementType, rawProps = {}) {
    switch (elementType) {
        case 'table-cell':
            return buildTableCellProps(rawProps);
        case 'table-row':
            return buildTableRowProps(rawProps);
        case 'figure':
            return buildFigureProps(rawProps);
        case 'image':
            return buildImageProps(rawProps);
        default:
            return {};
    }
}