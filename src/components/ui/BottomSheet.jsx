import { createEffect, onCleanup, onMount, splitProps } from 'solid-js';

function setBooleanAttribute(element, name, value) {
    if (!element) return;
    if (value) {
        element.setAttribute(name, '');
        return;
    }
    element.removeAttribute(name);
}

function mergeStyle(base, snap) {
    if (!snap) return base;

    if (typeof base === 'string') {
        return `${base};--snap:${snap}`;
    }

    return {
        ...(base || {}),
        '--snap': snap
    };
}

export function BottomSheet(props) {
    const [local, rest] = splitProps(props, [
        'children',
        'ref',
        'contentHeight',
        'nestedScroll',
        'nestedScrollOptimization',
        'expandToScroll',
        'swipeToDismiss',
        'onSnapPositionChange'
    ]);

    let elementRef;

    const setRef = (element) => {
        elementRef = element;
        if (typeof local.ref === 'function') {
            local.ref(element);
        }
    };

    onMount(() => {
        if (!customElements.get('bottom-sheet')) {
            console.warn(
                'bottom-sheet custom element is not registered. ' +
                'Register it with registerSheetElements() from pure-web-bottom-sheet.'
            );
        }

        const handleSnapPositionChange = (event) => {
            if (typeof local.onSnapPositionChange === 'function') {
                local.onSnapPositionChange(event);
            }
        };

        elementRef?.addEventListener('snap-position-change', handleSnapPositionChange);
        onCleanup(() => {
            elementRef?.removeEventListener('snap-position-change', handleSnapPositionChange);
        });
    });

    createEffect(() => {
        setBooleanAttribute(elementRef, 'content-height', Boolean(local.contentHeight));
        setBooleanAttribute(elementRef, 'nested-scroll', Boolean(local.nestedScroll));
        setBooleanAttribute(
            elementRef,
            'nested-scroll-optimization',
            Boolean(local.nestedScrollOptimization)
        );
        setBooleanAttribute(elementRef, 'expand-to-scroll', Boolean(local.expandToScroll));
        setBooleanAttribute(elementRef, 'swipe-to-dismiss', Boolean(local.swipeToDismiss));
    });

    return (
        <bottom-sheet ref={setRef} {...rest}>
            {local.children}
        </bottom-sheet>
    );
}

export function BottomSheetDialogManager(props) {
    return (
        <bottom-sheet-dialog-manager {...props}>
            {props.children}
        </bottom-sheet-dialog-manager>
    );
}

export function BottomSheetHeader(props) {
    return (
        <div slot="header" class={props.class} style={props.style}>
            {props.children}
        </div>
    );
}

export function BottomSheetFooter(props) {
    return (
        <div slot="footer" class={props.class} style={props.style}>
            {props.children}
        </div>
    );
}

export function BottomSheetSnap(props) {
    const style = mergeStyle(props.style, props.snap);

    return (
        <div
            slot="snap"
            class={props.initial ? `initial ${props.class || ''}`.trim() : props.class}
            style={style}
        />
    );
}
