// Must stay the first import: installs the X-Timezone header on axios/fetch
// before any service module creates its axios instance.
import './utils/timezone';
import axios from 'axios';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { installMustChangePasswordGuard } from './utils/loginSession';

// First login with a temporary password: any "403 MOT_DE_PASSE_A_CHANGER" answer (default axios
// instance or fetch) opens the forced "Nouveau mot de passe" page.
installMustChangePasswordGuard(axios);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for PWA install capability
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    console.log('ScholChat: New version available! Refresh to update.');
  },
  onSuccess: (registration) => {
    console.log('ScholChat: App ready for offline use.');
  },
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
