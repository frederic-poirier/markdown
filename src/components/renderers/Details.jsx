import ChevronRight from "lucide-solid/icons/chevron-right";
import { createSignal, Show } from "solid-js";

export function Details(props) {
    const [isOpen, setIsOpen] = createSignal(false);

    return (
        <details
            class="my-4 overflow-hidden group bg-neutral-100 border border-neutral-200 p-2 rounded-xl"
            open={isOpen()}
            onToggle={(e) => setIsOpen(e.target.open)}
        >
            {props.children}
        </details>
    );
}

export function Summary(props) {
    return (
        <summary class="flex text-sm text-neutral-600 items-center gap-2 cursor-pointer select-none font-medium ">
            <ChevronRight
                size={14}
                class="transition-transform group-open:rotate-90 text-neutral-600 shrink-0"
            />
            <span>{props.children}</span>
        </summary>
    );
}
