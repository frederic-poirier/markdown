import { Dynamic } from 'solid-js/web';

export function Table(props) {
  return (
    <div class="overflow-x-auto my-8 rounded-lg border border-[#1e1e1e]">
      <table class="min-w-full text-sm">
        {props.children}
      </table>
    </div>
  );
}

export function TableHead(props) {
  return (
    <thead class="bg-[#161616] border-b border-[#1e1e1e]">
      {props.children}
    </thead>
  );
}

export function TableBody(props) {
  return (
    <tbody class="bg-[#111]">
      {props.children}
    </tbody>
  );
}

export function TableRow(props) {
  return (
    <tr class="border-b border-[#1a1a1a] last:border-0 hover:bg-[#161616] transition-colors">
      {props.children}
    </tr>
  );
}

export function TableCell(props) {
  const isHeader = props.isHeader;
  const component = isHeader ? 'th' : 'td';
  
  const classes = isHeader
    ? 'px-4 py-2.5 text-left font-medium text-[#999] text-xs uppercase tracking-wider'
    : 'px-4 py-2.5 text-[#bbb]';
  
  return (
    <Dynamic component={component} class={classes}>
      {props.children}
    </Dynamic>
  );
}
