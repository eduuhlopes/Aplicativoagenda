import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import PublicBookingPage from './components/PublicBookingPage';
import PublicPaymentPage from './components/PublicPaymentPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const renderApp = () => {
    const path = window.location.pathname;
    if (path.startsWith('/agendar')) {
        return <PublicBookingPage />;
    }
    if (path.startsWith('/pagar/')) {
        return <PublicPaymentPage />;
    }
    return <App />;
};


root.render(
  <React.StrictMode>
    {renderApp()}
  </React.StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}