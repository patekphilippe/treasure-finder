import '@fontsource-variable/inter';
import 'leaflet/dist/leaflet.css';
import 'line-awesome/dist/line-awesome/css/line-awesome.min.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
