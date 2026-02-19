import { LAYOUT_RULES } from './rules.js';

export function transformLayout(node) {
    if (!node) return node;

    const sanitized = sanitizeAst(node);

    return transformNode(sanitized, {
        rules: LAYOUT_RULES
    });
}

function sanitizeAst(node) {
    if (!node) return node;

    delete node.position;
    delete node.data;

    if (!node.children?.length) return node;

    node.children = node.children
        .filter((child) => child?.type !== 'comment')
        .map((child) => sanitizeAst(child));

    return node;
}

function transformNode(node, context) {
    if (!node || !node.children?.length) return node;

    node.children = node.children.map((child) => transformNode(child, context));

    node.children = applyChildrenRules(node.children, node, context);

    return node;
}

function applyChildrenRules(children, parent, context) {
    if (!children?.length) return children;

    let transformedChildren = children;

    for (const rule of context.rules) {
        if (typeof rule.transformChildren !== 'function') continue;
        transformedChildren = rule.transformChildren(transformedChildren, {
            parent,
            ...context
        });
    }

    return transformedChildren;
}
