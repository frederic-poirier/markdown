import { Router, Route } from '@solidjs/router';
import { Layout } from './components/Layout.jsx';
import { Home, Preview } from './components/pages.jsx';
import { FileViewer } from './components/FileViewer.jsx';

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={Home} />
      <Route path="/preview" component={Preview} />
      <Route path="/:name" component={FileViewer} />
    </Router>
  );
}
