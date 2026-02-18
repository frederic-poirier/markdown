import { Match, Show, Switch, createResource, createSignal, onCleanup, onMount } from 'solid-js';

import Panzoom from '@panzoom/panzoom';
import Check from 'lucide-solid/icons/check';
import Copy from 'lucide-solid/icons/copy';
import ZoomIn from 'lucide-solid/icons/zoom-in';
import ZoomOut from 'lucide-solid/icons/zoom-out';
import mermaid from 'mermaid';
import { codeToHtml } from 'shiki';
import { toast } from 'solid-sonner';

const COPY_RESET_DELAY_MS = 2000;

export function CodeBlock(props) {
    const [copied, setCopied] = createSignal(false);
    const content = () => props.value || props.children;
    const [highlightedCode] = createHighlightedCodeResource(() => ({
        code: content(),
        lang: props.language
    }));

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content() || '');
            setCopied(true);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopied(false), COPY_RESET_DELAY_MS);
        } catch (error) {
            toast.error('Failed to copy');
        }
    };

    return (
        <Switch>
            <Match when={props.language === 'mermaid'}>
                <MermaidBlock>{content()}</MermaidBlock>
            </Match>

            <Match when={props.language && highlightedCode()}>
                <RegularCode highlightedCode={highlightedCode()} />
            </Match>

            <Match when={props.language}>
                <LanguageCodeBlock
                    copied={copied()}
                    content={content()}
                    language={props.language}
                    onCopy={handleCopy}
                />
            </Match>

            <Match>
                <InlineHtmlCodeBlock copied={copied()} content={content()} onCopy={handleCopy} />
            </Match>
        </Switch>
    );
}

function createHighlightedCodeResource(source) {
    return createResource(source, async ({ code, lang }) => {
        if (!lang || lang === 'mermaid') return null;

        try {
            return await codeToHtml(code, {
                lang,
                themes: {
                    light: 'github-light',
                    dark: 'github-dark'
                }
            });
        } catch (error) {
            console.error('Shiki highlighting error:', error);
            return null;
        }
    });
}

function CopyButton(props) {
    return (
        <button
            onClick={props.onCopy}
            class="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 transition-colors backdrop-blur-sm shadow-sm"
        >
            <Show when={props.copied} fallback={<><Copy size={14} /> Copy</>}>
                <Check size={14} /> Copied
            </Show>
        </button>
    );
}

function CopyButtonContainer(props) {
    return (
        <div class="absolute right-3 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton copied={props.copied} onCopy={props.onCopy} />
        </div>
    );
}

function LanguageCodeBlock(props) {
    return (
        <div class="group relative my-6">
            <CopyButtonContainer copied={props.copied} onCopy={props.onCopy} />
            <div class="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 rounded-t-lg">
                <span class="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                    {props.language}
                </span>
            </div>
            <pre class="m-0 rounded-t-none rounded-b-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 overflow-x-auto">
                <code class="text-[13px] leading-relaxed font-mono text-neutral-800 dark:text-neutral-200">
                    {props.content}
                </code>
            </pre>
        </div>
    );
}

function InlineHtmlCodeBlock(props) {
    return (
        <div class="group relative my-6">
            <CopyButtonContainer copied={props.copied} onCopy={props.onCopy} />
            <pre class="m-0 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4 overflow-x-auto">
                <code
                    class="text-[13px] leading-relaxed font-mono text-neutral-800 dark:text-neutral-200"
                    innerHTML={props.content}
                />
            </pre>
        </div>
    );
}

function RegularCode(props) {
    return (
        <div class="my-6 overflow-hidden rounded-lg border bg-neutral-100 border-neutral-200 dark:border-neutral-800">
            <code
                class="block text-[13px] leading-relaxed font-mono [&_.line]:!bg-none"
                innerHTML={props.highlightedCode}
            />
        </div>
    );
}

let mermaidInitialized = false;

async function getMermaidSVG(source) {
    if (!mermaidInitialized) {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            fontFamily: 'Geist Mono',
            fontSize: 16,
            flowchart: {
                curve: 'basis',
                useMaxWidth: true,
                nodeSpacing: 48,
                rankSpacing: 48
            }
        });
        mermaidInitialized = true;
    }

    const id = crypto.randomUUID();
    const { svg } = await mermaid.render(id, source);
    return svg;
}

function MermaidBlock(props) {
    const [svg] = createResource(() => props.children, getMermaidSVG);

    return (
        <Show when={svg()} fallback="loading">
            <PanzoomContainer content={svg()} />
        </Show>
    );
}


function PanzoomContainer(props) {
    let svgRef;
    let panzoom;

    onMount(() => {
        svgRef.innerHTML = props.content;
        panzoom = Panzoom(svgRef);
    });

    onCleanup(() => panzoom?.destroy());

    return (
        <div class="relative my-6 overflow-hidden cursor-grab p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
            <div class="absolute right-3 top-3 z-10 flex gap-1 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
                <button
                    class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-700 dark:text-neutral-300"
                    onClick={() => panzoom.zoomIn()}
                >
                    <ZoomIn size={16} />
                </button>
                <div class="w-px bg-neutral-200 dark:bg-neutral-700" />
                <button
                    class="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-neutral-700 dark:text-neutral-300"
                    onClick={() => panzoom.zoomOut()}
                >
                    <ZoomOut size={16} />
                </button>
            </div>
            <div ref={svgRef} />
        </div>
    );
}
