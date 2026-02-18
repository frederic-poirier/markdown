
import { clearSessionCookie } from "../utils/auth/cookies";

export async function onRequestPost({request}) {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie(request)
    }
  });
}

