
export function ToggleButton(props) {

  return (
    <button
      onClick={props.onClick}
      class="
        hover:bg-neutral-200 focus:bg-neutral-200 
        flex flex-col items-center justify-center
        text-sm
      "
      classList={{
        'text-neutral-600': !props.state(),
        'text-neutral-950': props.state()
      }}
    >
      {props.children}
    </button>
  )
}
