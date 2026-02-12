import { Dynamic } from 'solid-js/web';

export function Heading(props) {
  const level = props.level || 'h1';
  const id = props.id;
  
  const classes = {
    h1: 'text-4xl font-semibold mt-7 mb-2 text-neutral-100 tracking-tight leading-tight first:mt-0',
    h2: 'text-xl font-semibold mt-6 mb-2 text-neutral-200 tracking-tight leading-tight pb-3.5 border-b border-neutral-900',
    h3: 'text-lg font-medium mt-5 mb-2 text-neutral-200 leading-snug',
    h4: 'text-base font-medium mt-4 mb-2 text-neutral-300',
    h5: 'text-sm font-medium mt-3 mb-2 text-neutral-400 uppercase tracking-wider',
    h6: 'text-sm font-medium mt-2 mb-2 text-neutral-400'
  };
  
  return (
    <Dynamic component={level} id={id} class={classes[level]}>
      {props.children}
    </Dynamic>
  );
}
