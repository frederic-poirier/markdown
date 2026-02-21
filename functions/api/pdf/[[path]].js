import { requireAuth } from '../../utils/auth/requireAuth';

const DEFAULT_PDF_SERVICE_URL = 'https://pdf.texte.zip';

const ALLOWED_POST_PATHS = new Set(['/markdown']);
const ALLOWED_GET_PATHS = new Set(['/']);

function normalizePathname(pathname) {
    if (!pathname || pathname === '/') return '/';

    const parts = pathname
        .split('/')
        .filter(Boolean);

    if (parts.length === 0) return '/';

    return `/${parts.join('/')}`;
}

function getServicePathFromRequest(request) {
    const url = new URL(request.url);
    const routePrefix = '/api/pdf';

    const routePath = url.pathname.startsWith(routePrefix)
        ? url.pathname.slice(routePrefix.length)
        : '/';

    return normalizePathname(routePath);
}

function isAllowedServicePath(method, servicePath) {
    if (method === 'GET') {
        return ALLOWED_GET_PATHS.has(servicePath);
    }

    if (method === 'POST') {
        return ALLOWED_POST_PATHS.has(servicePath);
    }

    return false;
}

function joinPath(basePath, servicePath) {
    const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    const normalizedServicePath = servicePath.startsWith('/') ? servicePath : `/${servicePath}`;
    return `${normalizedBase}${normalizedServicePath}`;
}

function buildUpstreamUrl(request, baseUrl, servicePath) {
    const requestUrl = new URL(request.url);
    const upstreamUrl = new URL(baseUrl);

    upstreamUrl.pathname = joinPath(upstreamUrl.pathname, servicePath);
    upstreamUrl.search = requestUrl.search;

    return upstreamUrl;
}

function buildUpstreamHeaders(request, env) {
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('cookie');
    headers.set('CF-Access-Client-Id', env.CF_ACCESS_CLIENT_ID);
    headers.set('CF-Access-Client-Secret', env.CF_ACCESS_CLIENT_SECRET);
    return headers;
}

async function proxyToPdfService(request, env, refreshCookie) {
    const method = request.method.toUpperCase();
    const servicePath = getServicePathFromRequest(request);

    if (!isAllowedServicePath(method, servicePath)) {
        return new Response(JSON.stringify({ error: 'Marker endpoint not allowed' }), {
            status: 404,
            headers: {
                'Content-Type': 'application/json',
                ...(refreshCookie ? { 'Set-Cookie': refreshCookie } : {})
            }
        });
    }

    const baseUrl = env.PDF_SERVICE_BASE_URL || DEFAULT_PDF_SERVICE_URL;
    const upstreamUrl = buildUpstreamUrl(request, baseUrl, servicePath);

    const upstreamRequest = {
        method,
        headers: buildUpstreamHeaders(request, env),
        redirect: 'manual'
    };

    if (method !== 'GET' && method !== 'HEAD') {
        upstreamRequest.body = request.body;
    }

    const upstreamResponse = await fetch(upstreamUrl, upstreamRequest);

    if (upstreamResponse.status >= 300 && upstreamResponse.status < 400) {
        const location = upstreamResponse.headers.get('Location') || '';
        const headers = new Headers({ 'Content-Type': 'application/json' });

        if (refreshCookie) {
            headers.append('Set-Cookie', refreshCookie);
        }

        if (location.includes('/cdn-cgi/access/login')) {
            return new Response(
                JSON.stringify({
                    error: 'Cloudflare Access denied upstream request. Check service token policy and secrets.'
                }),
                {
                    status: 502,
                    headers
                }
            );
        }

        return new Response(
            JSON.stringify({
                error: 'Unexpected redirect from PDF service',
                location
            }),
            {
                status: 502,
                headers
            }
        );
    }

    const responseHeaders = new Headers(upstreamResponse.headers);

    if (refreshCookie) {
        responseHeaders.append('Set-Cookie', refreshCookie);
    }

    return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders
    });
}

async function handleRequest({ request, env }) {
    const result = await requireAuth(request, env);
    if (result instanceof Response) return result;

    if (!env.CF_ACCESS_CLIENT_ID || !env.CF_ACCESS_CLIENT_SECRET) {
        const headers = new Headers({ 'Content-Type': 'application/json' });
        const refreshCookie = result.headers.get('Set-Cookie');

        if (refreshCookie) {
            headers.append('Set-Cookie', refreshCookie);
        }

        return new Response(
            JSON.stringify({ error: 'Cloudflare Access service token is not configured' }),
            {
                status: 500,
                headers
            }
        );
    }

    try {
        return await proxyToPdfService(request, env, result.headers.get('Set-Cookie'));
    } catch (error) {
        console.error('pdf proxy error:', error);

        const headers = new Headers({ 'Content-Type': 'application/json' });
        const refreshCookie = result.headers.get('Set-Cookie');

        if (refreshCookie) {
            headers.append('Set-Cookie', refreshCookie);
        }

        return new Response(JSON.stringify({ error: 'Failed to reach PDF service' }), {
            status: 502,
            headers
        });
    }
}

export async function onRequestGet(context) {
    return handleRequest(context);
}

export async function onRequestPost(context) {
    return handleRequest(context);
}
