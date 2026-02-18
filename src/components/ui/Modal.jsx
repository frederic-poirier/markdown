import { createSignal, onMount } from "solid-js"

export function useModal() {
  const [anchorElement, setAnchorElement] = createSignal()
  const id = crypto.randomUUID()
  let modalREF

  onMount(() => {
    if (modalREF) {
      modalREF.style.setProperty("position-anchor", "--" + id)
    }
  })


  const openModal = () => {
    if (modalREF) modalREF.showPopover()
  }

  const closeModal = () => {
    if (modalREF) modalREF.hidePopover()
  }

  const toggleModal = (e) => {
    const element = e.currentTarget;
    const isOpen = modalREF.matches(":popover-open")
    removeAnchor()

    if (isOpen) {
      closeModal()
    } else {
      openModal()
      setAnchor(element)
    }
  }

  const setAnchor = (element) => {
    element.style.setProperty("anchor-name", "--" + id)
    setAnchorElement(element)
  }

  const removeAnchor = () => {
    if (anchorElement()) {
      anchorElement().style.setProperty("anchor-name", "")
    }
  }

  function Modal(props) {
    return (
      <div
        ref={modalREF}
        popover
        id={id}
        class="
        modal 
        bg-neutral-100 text-neutral-600 border border-neutral-200 
        opacity-100 scale-100
        starting:opacity-0 starting:scale-95
        transition-opacity transition-transform transition-discrete duration-300 ease-out
        rounded-xl"
      >
        {props.children}
      </div>
    )
  }
  return { openModal, closeModal, toggleModal, Modal }
}

