import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import '@fontsource-variable/inter';
import '@fontsource/noto-sans-tamil/400.css';
import '@fontsource/noto-sans-devanagari/400.css';
import '@fontsource/noto-sans-telugu/400.css';
import './styles.css';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
