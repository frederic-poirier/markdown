import { Dynamic } from 'solid-js/web';

export function List(props) {
  const isOrdered = props.ordered;
  const component = isOrdered ? 'ol' : 'ul';

  const classes = isOrdered
    ? 'list-decimal my-3 space-y-1.5 pl-6'
    : 'list-disc my-3 space-y-1.5 pl-6';

  return (
    <Dynamic component={component} class={classes}>
      {props.children}
    </Dynamic>
  );
}

export function ListItem(props) {
  return (
    <li class="text-[0.9375rem] leading-[1.8] pl-1.5 [&>ul]:mt-2.5 [&>ol]:mt-2.5 [&>p]:my-1.5">
      {props.children}
    </li>
  );
}
