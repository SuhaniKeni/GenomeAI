import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { initClarity } from './utils/clarity.js';
import './styles/global.css';

const basename = window.location.pathname.startsWith('/app') ? '/app' : '/';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// Initialize Microsoft Clarity telemetry conditionally after React app startup
initClarity();