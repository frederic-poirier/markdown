import { RENDER_TRANSFORM_RULES } from "./rules/index.js";

export function transformHAST(node) {
  if (!node) return node;

  const sanitized = sanitizeHAST(node);

  return transformNode(sanitized, {
    rules: RENDER_TRANSFORM_RULES,
  });
}

function sanitizeHAST(node) {
  if (!node) return node;

  delete node.position;
  delete node.data;

  if (!node.children?.length) return node;

  node.children = node.children
    .filter((child) => child?.type !== "comment")
    .map((child) => sanitizeHAST(child));

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
    if (typeof rule.transformChildren !== "function") continue;
    transformedChildren = rule.transformChildren(transformedChildren, {
      parent,
      ...context,
    });
  }

  return transformedChildren;
}
