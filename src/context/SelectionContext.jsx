import {
  createContext,
  useContext,
  createSignal,
  onCleanup
} from "solid-js"
import { Portal } from "solid-js/web"

const SelectionContext = createContext()

export function SelectionProvider(props) {
  const [mouseDown, setMouseDown] = createSignal(false)
  const [start, setStart] = createSignal({ x: 0, y: 0 })
  const [current, setCurrent] = createSignal({ x: 0, y: 0 })
  const [selected, setSelected] = createSignal(new Set())
  const [registry, setRegistry] = createSignal(new Map())

  const rect = () => {
    const s = start()
    const c = current()

    const x = Math.min(s.x, c.x)
    const y = Math.min(s.y, c.y)
    const width = Math.abs(c.x - s.x)
    const height = Math.abs(c.y - s.y)

    return { x, y, width, height }
  }

  const register = (id, el) => {
    setRegistry(prev => {
      const next = new Map(prev)
      next.set(id, el)
      return next
    })

    onCleanup(() => {
      setRegistry(prev => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
    })
  }

  const computeSelection = () => {
    const r = rect()
    const nextSelected = new Set()

    registry().forEach((el, id) => {
      const box = el.getBoundingClientRect()

      const overlap =
        box.left < r.x + r.width &&
        box.right > r.x &&
        box.top < r.y + r.height &&
        box.bottom > r.y

      if (overlap) nextSelected.add(id)
    })

    setSelected(nextSelected)
  }

  const handleMouseDown = (e) => {
    setMouseDown(true)
    setStart({ x: e.clientX, y: e.clientY })
    setCurrent({ x: e.clientX, y: e.clientY })
    setSelected(new Set())
  }

  const handleMouseMove = (e) => {
    if (!mouseDown()) return
    setCurrent({ x: e.clientX, y: e.clientY })
    computeSelection()
  }

  const handleMouseUp = () => {
    setMouseDown(false)
  }

  window.addEventListener("mousedown", handleMouseDown)
  window.addEventListener("mousemove", handleMouseMove)
  window.addEventListener("mouseup", handleMouseUp)

  onCleanup(() => {
    window.removeEventListener("mousedown", handleMouseDown)
    window.removeEventListener("mousemove", handleMouseMove)
    window.removeEventListener("mouseup", handleMouseUp)
  })

  return (
    <SelectionContext.Provider
      value={{
        register,
        selected,
        isSelected: (id) => selected().has(id),
        hasSelection: () => selected().size > 0
      }}
    >
      {props.children}

      <Portal>
        {mouseDown() && (
          <div
            style={{
              position: "fixed",
              left: `${rect().x}px`,
              top: `${rect().y}px`,
              width: `${rect().width}px`,
              height: `${rect().height}px`,
              "pointer-events": "none",
              "z-index": 9999
            }}
            class="bg-blue-500/10 border border-blue-500/30 rounded-xl"
          />
        )}
      </Portal>
    </SelectionContext.Provider>
  )
}

export function useSelection() {
  const ctx = useContext(SelectionContext)
  if (!ctx) throw new Error("useSelection must be used inside SelectionProvider")
  return ctx
}

