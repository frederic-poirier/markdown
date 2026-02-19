export function createCodeBlockTransformRule() {
    return {
        name: 'codeblock-from-pre-code',
        transformChildren(children) {
            if (!children?.length) return children;

            return children.map((node) => {
                if (!isElement(node, 'pre')) return node;

                const codeNode = node.children?.find((child) => isElement(child, 'code'));
                if (!codeNode) return node;

                return {
                    type: 'element',
                    tagName: 'codeblock',
                    properties: {
                        language: extractCodeLanguage(codeNode.properties.className),
                        value: readTextContent(codeNode)
                    },
                    children: []
                };
            });
        }
    };
}

function isElement(node, tagName) {
    if (!node || node.type !== 'element') return false;
    if (!tagName) return true;
    return node.tagName === tagName;
}

function extractCodeLanguage(className) {
    if (Array.isArray(className)) {
        const classToken = className.find((entry) => entry?.startsWith('language-'));
        return classToken?.replace('language-', '') || undefined;
    }

    if (typeof className === 'string') {
        const classToken = className
            .split(/\s+/)
            .find((entry) => entry?.startsWith('language-'));

        return classToken?.replace('language-', '') || undefined;
    }

    return undefined;
}

function readTextContent(node) {
    if (!node) return '';
    if (node.type === 'text') return node.value || '';
    if (!node.children?.length) return '';

    return node.children.map((child) => readTextContent(child)).join('');
}
