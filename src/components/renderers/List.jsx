import { Dynamic } from 'solid-js/web';

export function List(props) {
  const isOrdered = props.ordered;
  const component = isOrdered ? 'ol' : 'ul';
  
  const classes = isOrdered 
    ? 'list-decimal list-outside my-6 space-y-2.5 text-[#bbb] pl-6 marker:text-[#555]'
    : 'list-disc list-outside my-6 space-y-2.5 text-[#bbb] pl-6 marker:text-[#3a3a3a]';
  
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
