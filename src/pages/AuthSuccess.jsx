export default function AuthSuccess() {
    if (window.opener) {
        window.opener.postMessage({ type: 'oauth-success' }, window.location.origin);
        window.close();
    }
    return null;
}