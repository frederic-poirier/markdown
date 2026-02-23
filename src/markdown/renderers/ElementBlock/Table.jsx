import { Dynamic } from 'solid-js/web';

const TEXT_ALIGN_VALUES = new Set(['left', 'center', 'right', 'justify']);
const VERTICAL_ALIGN_VALUES = new Set(['top', 'middle', 'bottom', 'baseline']);

function normalizeAlign(align) {
  if (!align) return undefined;
  const value = String(align).toLowerCase();
  return TEXT_ALIGN_VALUES.has(value) ? value : undefined;
}

function normalizeVAlign(align) {
  if (!align) return undefined;
  const value = String(align).toLowerCase();
  return VERTICAL_ALIGN_VALUES.has(value) ? value : undefined;
}

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

function buildAlignmentProps(rawProps) {
  const style = {};
  const align = normalizeAlign(rawProps.align);
  const vAlign = normalizeVAlign(rawProps.vAlign);

  if (align) {
    style['text-align'] = align;
  }

  if (vAlign) {
    style['vertical-align'] = vAlign;
  }

  if (!Object.keys(style).length) {
    return {};
  }

  return { style };
}

function buildCellSpanProps(rawProps) {
  const colSpan = toPositiveInteger(rawProps.colSpan);
  const rowSpan = toPositiveInteger(rawProps.rowSpan);
  const props = {};

  if (colSpan) props.colSpan = colSpan;
  if (rowSpan) props.rowSpan = rowSpan;

  return props;
}

export function Table(props) {
  return (
    <div class="overflow-x-auto mt-2 mb-4 rounded-lg border border-neutral-200">
      <table class="min-w-full text-sm">
        {props.children}
      </table>
    </div>
  );
}

export function TableHead(props) {
  return (
    <thead class="bg-neutral-100 border-b border-neutral-200">
      {props.children}
    </thead>
  );
}

export function TableBody(props) {
  return (
    <tbody class="bg-neutral-50">
      {props.children}
    </tbody>
  );
}

export function TableRow(props) {
  const rowProps = buildAlignmentProps(props);

  return (
    <tr
      class="border-b border-neutral-200 last:border-0 hover:bg-neutral-100 transition-colors"
      {...rowProps}
    >
      {props.children}
    </tr>
  );
}

export function TableCell(props) {
  const isHeader = props.isHeader;
  const component = isHeader ? 'th' : 'td';
  const cellProps = {
    ...buildAlignmentProps(props),
    ...buildCellSpanProps(props)
  };

  const classes = isHeader
    ? 'px-4 py-2.5 text-left font-medium text-neutral-600 text-xs uppercase tracking-wider'
    : 'px-4 py-2.5 text-neutral-600';

  return (
    <Dynamic
      component={component}
      class={classes}
      {...cellProps}
    >
      {props.children}
    </Dynamic>
  );
}
