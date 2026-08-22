import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';
import { SocketProvider } from './context/SocketContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '263358758822-7arp026qapdqh260n22io7d7ee1jlsip.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
