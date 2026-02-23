import { requireAuth } from "../utils/auth/requireAuth";

export async function onRequest(context) {
  const result = await requireAuth(context.request, context.env);
  if (result instanceof Response) return result

  context.data.auth = result.auth;
  context.data.headers = result.headers

  return context.next();
} 
