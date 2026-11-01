import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availablePages, setAvailablePages] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await authAPI.getCurrentUser();
      const pagesResponse = await authAPI.getAvailablePages();
      
      // Extract pages array and permissions from response
      const pages = pagesResponse.pages || [];
      const permissions = pagesResponse.permissions || [];
      
      setUser(userData);
      setAvailablePages(pages);
      setUserPermissions(permissions);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      localStorage.removeItem('auth_token');
      setUser(null);
      setAvailablePages([]);
      setUserPermissions([]);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      console.log('🔍 Login response:', response);
      const { session_token, user: userData } = response;

      // Store token
      localStorage.setItem('auth_token', session_token);
      console.log('✅ Token stored:', session_token ? session_token.substring(0, 10) + '...' : 'undefined');

      // Get user pages/permissions  
      const pagesResponse = await authAPI.getAvailablePages();
      console.log('📝 Pages response:', pagesResponse);
      
      // Extract pages array and permissions from response
      const pages = pagesResponse.pages || [];
      const permissions = pagesResponse.permissions || [];
      
      setUser(userData);
      setAvailablePages(pages);
      setUserPermissions(permissions);
      setIsAuthenticated(true);
      
      console.log('✅ Set pages:', pages.length, 'Set permissions:', permissions.length);

      toast.success(`Welcome back, ${userData.g_fullname || userData.g_username}!`);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local state
      localStorage.removeItem('auth_token');
      setUser(null);
      setAvailablePages([]);
      setUserPermissions([]);
      setIsAuthenticated(false);
      toast.success('You have been logged out successfully.');
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      toast.success('Password changed successfully!');
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      const message = error.response?.data?.message || 'Failed to change password.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const refreshUserData = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      const pagesResponse = await authAPI.getAvailablePages();
      
      // Extract pages array and permissions from response
      const pages = pagesResponse.pages || [];
      const permissions = pagesResponse.permissions || [];
      
      setUser(userData);
      setAvailablePages(pages);
      setUserPermissions(permissions);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  // Helper functions for role checking
  const hasRole = (role) => {
    return user?.roles?.includes(role) || user?.g_role === role || user?.role === role;
  };

  const hasPermission = (permission) => {
    // Check user permissions array or availablePages
    return userPermissions.includes(permission) || 
           user?.permissions?.includes(permission) || 
           (Array.isArray(availablePages) && availablePages.some(page => 
             page.required_permissions?.includes(permission)
           ));
  };

  const canAccessPage = (pagePath) => {
    return Array.isArray(availablePages) && availablePages.some(page => page.path === pagePath || page.route === pagePath);
  };

  // Check if user is admin
  const isAdmin = () => {
    return hasRole('admin') || hasRole('administrator') || user?.is_admin;
  };

  // Check if user can manage users
  const canManageUsers = () => {
    return isAdmin() || hasPermission('manage_users') || hasRole('user_manager');
  };

  // Check if user can access reports
  const canAccessReports = () => {
    return hasPermission('view_reports') || hasRole('manager') || isAdmin();
  };

  const value = {
    // State
    user,
    loading,
    isAuthenticated,
    availablePages,
    userPermissions,
    
    // Actions
    login,
    logout,
    changePassword,
    refreshUserData,
    
    // Role/Permission helpers
    hasRole,
    hasPermission,
    canAccessPage,
    isAdmin,
    canManageUsers,
    canAccessReports
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
