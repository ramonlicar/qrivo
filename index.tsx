
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Adiciona um fallback visual enquanto carrega
rootElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #EEEEEC; font-family: Inter, sans-serif;"><div style="text-align: center;"><div style="width: 40px; height: 40px; border: 4px solid #DBFBED; border-top: 4px solid #09B86D; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div><p style="color: #242422; font-size: 13px; font-weight: 500;">Carregando Qrivo...</p></div></div><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
