import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldExclamationIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredPermission = null, 
  fallback = null 
}) => {
  const { isAuthenticated, loading, hasRole, hasPermission, isAdmin } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, this will be handled by the AuthWrapper
  if (!isAuthenticated) {
    return null;
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole) && !isAdmin()) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <ShieldExclamationIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. 
              {requiredRole && ` Required role: ${requiredRole}`}
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-secondary px-6 py-2 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission) && !isAdmin()) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <LockClosedIcon className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Permission Required</h2>
            <p className="text-gray-600 mb-6">
              You don't have the required permission to access this feature.
              {requiredPermission && ` Required permission: ${requiredPermission}`}
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-secondary px-6 py-2 rounded-lg"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If all checks pass, render the protected content
  return children;
};

// Higher-order component version
export const withProtectedRoute = (Component, options = {}) => {
  return (props) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Specialized protected route components
export const AdminOnlyRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredRole="admin" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const ManagerRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredRole="manager" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const UserManagementRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredPermission="manage_users" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export const ReportsRoute = ({ children, fallback }) => (
  <ProtectedRoute requiredPermission="view_reports" fallback={fallback}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;
