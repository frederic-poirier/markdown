import { onMount } from "solid-js"
import { useSelection } from "../../context/SelectionContext.jsx"

export function Selectable(props) {
  let ref
  const selection = useSelection()

  onMount(() => {
    selection.register(props.id, ref)
  })

  const isSelected = () => selection.selected().has(props.id)

  return (
    <div
      ref={ref}
    >
      {props.children}
    </div>
  )
}

