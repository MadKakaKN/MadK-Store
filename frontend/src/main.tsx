import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { initMonitoring } from './utils/monitoring';
import { backendKeepAlive } from './services/backendKeepAlive';

initMonitoring();
backendKeepAlive.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
