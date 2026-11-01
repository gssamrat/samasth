import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from './LoginModal';

const AuthWrapper = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <div className="relative min-h-screen bg-white">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-800 text-lg font-medium">Loading Samasth Dashboard...</p>
            <p className="text-gray-600 text-sm mt-2">Please wait while we verify your session</p>
          </div>
        </div>
      )}

      {/* Login Modal Overlay */}
      {!loading && !isAuthenticated && (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center z-50 p-4">
          <LoginModal />
        </div>
      )}

      {/* Main Application Content - Only show when authenticated */}
      {!loading && isAuthenticated && children}
    </div>
  );
};

export default AuthWrapper;
