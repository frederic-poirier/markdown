const GALLERY_MIN_IMAGES = 3;

const NEUTRAL_WRAPPERS = new Set([
    'p',
    'a',
    'span',
    'div'
]);

export const LAYOUT_RULES = [
    createGalleryRule({
        minImages: GALLERY_MIN_IMAGES
    })
];

function createGalleryRule(options = {}) {
    const minImages = options.minImages ?? GALLERY_MIN_IMAGES;

    return {
        name: 'gallery-from-adjacent-images',
        transformChildren(children) {
            if (!children?.length) return children;

            const result = [];
            let index = 0;

            while (index < children.length) {
                const node = children[index];

                if (!isGalleryImageBlock(node)) {
                    result.push(node);
                    index += 1;
                    continue;
                }

                const consumed = [node];
                const imageNodes = [node];
                let cursor = index + 1;

                while (cursor < children.length) {
                    const current = children[cursor];

                    if (isIgnorableNode(current)) {
                        consumed.push(current);
                        cursor += 1;
                        continue;
                    }

                    if (!isGalleryImageBlock(current)) break;

                    consumed.push(current);
                    imageNodes.push(current);
                    cursor += 1;
                }

                if (imageNodes.length >= minImages) {
                    result.push({
                        type: 'element',
                        tagName: 'gallery',
                        properties: {},
                        children: imageNodes
                    });

                    const trailingIgnorable = getTrailingIgnorableNodes(consumed);
                    result.push(...trailingIgnorable);
                } else {
                    result.push(...consumed);
                }

                index = cursor;
            }

            return result;
        }
    };
}

function isGalleryImageBlock(node) {
    return findSingleNestedImage(node);
}

function findSingleNestedImage(node) {
    if (!node) return false;

    if (isElement(node, 'img')) return true;
    if (!isElement(node)) return false;
    if (!NEUTRAL_WRAPPERS.has(node.tagName)) return false;

    const meaningfulChildren = getMeaningfulChildren(node);
    if (meaningfulChildren.length !== 1) return false;

    return findSingleNestedImage(meaningfulChildren[0]);
}

function getTrailingIgnorableNodes(nodes) {
    const trailingNodes = [];

    for (let i = nodes.length - 1; i >= 0; i -= 1) {
        if (!isIgnorableNode(nodes[i])) break;
        trailingNodes.unshift(nodes[i]);
    }

    return trailingNodes;
}

function getMeaningfulChildren(node) {
    if (!node?.children?.length) return [];
    return node.children.filter((child) => !isIgnorableNode(child));
}

function isIgnorableNode(node) {
    if (!node) return true;
    if (node.type === 'comment') return true;
    if (node.type !== 'text') return false;
    return !node.value?.trim();
}

function isElement(node, tagName) {
    if (!node || node.type !== 'element') return false;
    if (!tagName) return true;
    return node.tagName === tagName;
}
