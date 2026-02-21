import { Router, Route } from "@solidjs/router";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FilesProvider } from "./context/FilesContext.jsx";
import { Toaster } from "solid-sonner";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import CodeView from "./pages/CodeView.jsx";
import Login from "./pages/Login.jsx";
import MediaView from "./pages/MediaView.jsx";
import TextView from "./pages/TextView.jsx";
import AuthSuccess from "./pages/AuthSuccess.jsx";

export default function App() {
  return (
    <AuthProvider>
      <FilesProvider>
        <Toaster position="bottom-right" />
        <Router root={Layout}>
          <Route path="/" component={Home} />
          <Route path="/text/:id" component={TextView} />
          <Route path="/code/:id" component={CodeView} />
          <Route path="/media/:id" component={MediaView} />
          <Route path="/login" component={Login} />
          <Route path="/success" component={AuthSuccess} />
        </Router>
      </FilesProvider>
    </AuthProvider>
  );
}
