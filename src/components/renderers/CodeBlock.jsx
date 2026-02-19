import { createResource, Show } from 'solid-js';

let shikiCodeToHtmlPromise;
let mermaidModulePromise;

async function getCodeToHtml() {
    if (!shikiCodeToHtmlPromise) {
        shikiCodeToHtmlPromise = import('shiki').then((module) => module.codeToHtml);
    }

    return await shikiCodeToHtmlPromise;
}

async function getMermaidModule() {
    if (!mermaidModulePromise) {
        mermaidModulePromise = import('mermaid').then((module) => module.default);
    }

    return await mermaidModulePromise;
}

export function CodeBlock(props) {
    const isUnstyled = () => Boolean(props.unstyled);
    const content = () => props.value || props.children || '';
    const [highlightedCode] = createResource(
        () => ({
            code: content(),
            lang: props.language
        }),
        async ({ code, lang }) => {
            if (!lang || lang === 'mermaid') return null;

            try {
                const codeToHtml = await getCodeToHtml();
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
        }
    );

    if (props.language === 'mermaid') {
        return <MermaidBlock>{content()}</MermaidBlock>;
    }

    return (
        <div
            class="overflow-x-auto"
            classList={{
                'my-6 rounded-lg border border-neutral-200 bg-neutral-100': !isUnstyled()
            }}
        >
            <Show
                when={props.language && highlightedCode()}
                fallback={(
                    <pre
                        class="m-0"
                        classList={{
                            'p-4': !isUnstyled()
                        }}
                    >
                        <code class="text-sm leading-relaxed font-mono text-neutral-600">
                            {content()}
                        </code>
                    </pre>
                )}
            >
                <code
                    class="block text-sm leading-relaxed font-mono [&_.line]:!bg-none"
                    classList={{
                        '[&_pre]:!p-0 [&_.shiki]:!p-0': isUnstyled()
                    }}
                    innerHTML={highlightedCode()}
                />
            </Show>
        </div>
    );
}

let mermaidInitialized = false;

function normalizeMermaidError(error) {
    const fallback = 'Invalid Mermaid syntax';
    const raw = typeof error?.message === 'string' && error.message.trim().length > 0
        ? error.message
        : fallback;

    const compact = raw
        .replace(/\s+/g, ' ')
        .replace(/mermaid\s+version\s+[0-9]+\.[0-9]+\.[0-9]+/gi, '')
        .replace(/Syntax error in text/gi, 'Syntax error')
        .trim();

    if (!compact) return fallback;
    return compact;
}

function cleanupMermaidArtifacts(id) {
    if (typeof document === 'undefined') return;

    const ids = [id, `d${id}`];
    for (const candidate of ids) {
        const element = document.getElementById(candidate);
        if (element && !element.closest('.mermaid-render-root')) {
            element.remove();
        }
    }

    const strayNodes = document.querySelectorAll('[id^="dmermaid-"]');
    for (const node of strayNodes) {
        if (!node.closest('.mermaid-render-root')) {
            node.remove();
        }
    }
}

async function validateMermaidSource(mermaid, source) {
    try {
        const parsed = await mermaid.parse(source, { suppressErrors: true });
        if (parsed === false) {
            return {
                ok: false,
                error: 'Syntax error'
            };
        }

        return {
            ok: true,
            error: null
        };
    } catch (error) {
        return {
            ok: false,
            error: normalizeMermaidError(error)
        };
    }
}

async function getMermaidResult(source) {
    const content = source || '';

    if (!content.trim()) {
        return {
            svg: null,
            error: 'Empty Mermaid diagram'
        };
    }

    try {
        const mermaid = await getMermaidModule();

        if (!mermaidInitialized) {
            mermaid.initialize({
                startOnLoad: false,
                suppressErrorRendering: true,
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

        const validation = await validateMermaidSource(mermaid, content);
        if (!validation.ok) {
            return {
                svg: null,
                error: validation.error || 'Syntax error'
            };
        }

        const id = `mermaid-${crypto.randomUUID()}`;
        const { svg } = await mermaid.render(id, content);
        cleanupMermaidArtifacts(id);

        if (typeof svg !== 'string' || !svg.includes('<svg')) {
            return {
                svg: null,
                error: 'Could not render Mermaid diagram'
            };
        }

        return { svg, error: null };
    } catch (error) {
        console.error('Mermaid parsing error:', error);
        return {
            svg: null,
            error: normalizeMermaidError(error)
        };
    }
}

function MermaidBlock(props) {
    const [result] = createResource(() => props.children, getMermaidResult);

    return (
        <Show
            when={result()}
            fallback={<div class="my-6 rounded-lg border border-neutral-200 bg-neutral-100 p-4">loading</div>}
        >
            <Show
                when={result().svg}
                fallback={(
                    <div class="my-6 rounded-lg border border-neutral-200 bg-neutral-100 p-4 text-sm text-neutral-600">
                        Mermaid parsing error: {result().error || 'Syntax error'}
                    </div>
                )}
            >
                <div class="my-6 rounded-lg border border-neutral-200 bg-neutral-100 p-4 overflow-auto">
                    <div class="mermaid-render-root" innerHTML={result().svg} />
                </div>
            </Show>
        </Show>
    );
}
