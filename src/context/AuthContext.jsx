import { createContext, useContext, createSignal, onMount, onCleanup } from 'solid-js';

const AuthContext = createContext();

export function AuthProvider(props) {
  const [user, setUser] = createSignal(null);
  const [loading, setLoading] = createSignal(true);


  const fetchUser = async () => {
    try {
      const response = await fetch('/auth/me');
      if (!response.ok) return setUser(null)
      const data = await response.json()
      setUser(data)
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const login = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      '/auth/login',
      'oauth-popup',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );
  };

  onMount(() => {
    fetchUser();

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'oauth-success') fetchUser();
    };

    window.addEventListener('message', handleMessage);
    onCleanup(() => window.removeEventListener('message', handleMessage));
  });

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetch: fetchUser }}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}


