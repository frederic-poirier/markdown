import { Dynamic } from 'solid-js/web';

export function Heading(props) {
  const level = props.level || 'h1';
  const id = props.id;
  
  const classes = {
    h1: 'text-[1.875rem] font-semibold mt-16 mb-5 text-[#f0f0f0] tracking-tight leading-tight first:mt-0',
    h2: 'text-[1.375rem] font-semibold mt-14 mb-5 text-[#e8e8e8] tracking-tight leading-tight pb-3.5 border-b border-[#1e1e1e]',
    h3: 'text-[1.125rem] font-medium mt-12 mb-4 text-[#e0e0e0] leading-snug',
    h4: 'text-base font-medium mt-10 mb-3 text-[#d0d0d0]',
    h5: 'text-sm font-medium mt-8 mb-2.5 text-[#c0c0c0] uppercase tracking-wider',
    h6: 'text-sm font-medium mt-6 mb-2.5 text-[#999]'
  };
  
  return (
    <Dynamic component={level} id={id} class={classes[level]}>
      {props.children}
    </Dynamic>
  );
}
