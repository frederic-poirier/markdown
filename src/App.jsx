import { Router, Route } from '@solidjs/router';
import { AuthProvider } from './context/AuthContext.jsx';
import { Toaster } from 'solid-sonner';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import View from "./pages/View.jsx"
import Login from './pages/Login.jsx';
import AuthSuccess from './pages/AuthSuccess.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" />
      <Router root={Layout}>
        <Route path="/" component={Home} />
        <Route path="/view/:id" component={View} />
        <Route path="/login" component={Login} />
        <Route path="/success" component={AuthSuccess} />
      </Router>
    </AuthProvider>
  );
}
