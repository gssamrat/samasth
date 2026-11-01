import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { LocalizationProvider } from './contexts/LocalizationContext';
import AuthWrapper from './components/auth/AuthWrapper';
import Home from './components/Home';
import Version from './components/Version';
import HealthCheck from './components/HealthCheck';
import api from './services/api';
import './App.css';

// Set up API interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    console.log('🔍 API Interceptor:', {
      url: config.url,
      method: config.method,
      token: token ? `${token.substring(0, 10)}...` : 'No token',
      hasAuthHeader: !!config.headers.Authorization
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Added Authorization header:', config.headers.Authorization.substring(0, 20) + '...');
    } else {
      console.log('⚠️ No token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('❌ API Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      hasAuthHeader: !!response.config.headers.Authorization
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      hasAuthHeader: !!error.config?.headers?.Authorization
    });
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - clearing token');
      localStorage.removeItem('auth_token');
      // Optionally redirect to login or trigger logout
    }
    
    return Promise.reject(error);
  }
);

function App() {
  return (
    <BrowserRouter>
      <LocalizationProvider>
        <AuthProvider>
          <AuthWrapper>
            <Home />
            <Version />
            <HealthCheck />
          </AuthWrapper>
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              fontSize: '14px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              minWidth: '200px',
              maxWidth: '500px',
              padding: '16px',
            },
            success: {
              style: {
                border: '1px solid #10b981',
              },
            },
            error: {
              style: {
                border: '1px solid #ef4444',
              },
            },
          }}
        />
      </AuthProvider>
      </LocalizationProvider>
    </BrowserRouter>
  );
}

export default App
