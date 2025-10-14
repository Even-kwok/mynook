
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import FigmaHomePrototype from './components/FigmaHomePrototype';
import { AuthProvider } from './context/AuthContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Simple conditional mount for prototype route without adding router dependency
const isProtoRoute = (() => {
  const { pathname, hash } = window.location;
  return pathname === '/proto' || hash === '#/proto' || hash === '#proto';
})();

root.render(
  <React.StrictMode>
    <AuthProvider>
      {isProtoRoute ? <FigmaHomePrototype /> : <App />}
    </AuthProvider>
  </React.StrictMode>
);
