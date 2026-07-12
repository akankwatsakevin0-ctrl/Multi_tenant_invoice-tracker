// =============================================================================
// Entry Point
// =============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './index.css';

const rootEl = document.getElementById('root');

if (!rootEl) {
  throw new Error('Root element not found. Ensure there is a <div id="root"> in your index.html.');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
