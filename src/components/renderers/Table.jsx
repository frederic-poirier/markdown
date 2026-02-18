import { Dynamic } from 'solid-js/web';
import { applyElementProps } from '../../utils/elementProps.js';

export function Table(props) {
  return (
    <div class="overflow-x-auto mt-2 mb-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table class="min-w-full text-sm">
        {props.children}
      </table>
    </div>
  );
}

export function TableHead(props) {
  return (
    <thead class="bg-neutral-100 dark:bg-neutral-850 border-b border-neutral-200 dark:border-neutral-800">
      {props.children}
    </thead>
  );
}

export function TableBody(props) {
  return (
    <tbody class="bg-white dark:bg-neutral-900">
      {props.children}
    </tbody>
  );
}

export function TableRow(props) {
  const rowProps = applyElementProps('table-row', props);

  return (
    <tr
      class="border-b border-neutral-200 dark:border-neutral-800 last:border-0 hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors"
      {...rowProps}
    >
      {props.children}
    </tr>
  );
}

export function TableCell(props) {
  const isHeader = props.isHeader;
  const component = isHeader ? 'th' : 'td';
  const cellProps = applyElementProps('table-cell', props);

  const classes = isHeader
    ? 'px-4 py-2.5 text-left font-medium text-neutral-600 dark:text-neutral-600 text-xs uppercase tracking-wider'
    : 'px-4 py-2.5 text-neutral-600 dark:text-neutral-600';

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
