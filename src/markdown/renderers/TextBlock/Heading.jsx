import { Dynamic } from 'solid-js/web';

export function Heading(props) {

  const classes = {
    h1: 'text-4xl font-semibold mt-7 mb-7 tracking-tight leading-tight first:mt-0',
    h2: 'text-xl font-semibold mt-12 mb-4 tracking-tight leading-tight pb-3.5 border-b border-neutral-200',
    h3: 'text-lg font-medium mt-5 mb-2 leading-snug',
    h4: 'text-base font-medium mt-4 mb-2 text-neutral-600',
    h5: 'text-sm font-medium mt-3 mb-2 text-neutral-600 uppercase tracking-wider',
    h6: 'text-sm font-medium mt-2 mb-2 text-neutral-600'
  };

  return (
    <Dynamic
      component={props.node.tagName}
      id={props.node.id}
      class={classes[props.node.tagName]}
    >
      {props.children}
    </Dynamic>
  );
}
