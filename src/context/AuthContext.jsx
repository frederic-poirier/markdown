import { createContext, useContext, createSignal, onMount } from 'solid-js';

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
    window.location.href = '/auth/login';
  };

  onMount(() => {
    fetchUser();

    return;
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
