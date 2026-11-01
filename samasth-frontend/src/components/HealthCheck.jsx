import React, { useState, useEffect, useRef } from 'react';
import { entityAPI } from '../services/api';
import toast from 'react-hot-toast';

const HealthCheck = () => {
  const [status, setStatus] = useState('checking');
  const [loading, setLoading] = useState(false);
  const isCheckingRef = useRef(false);

  const checkHealth = async () => {
    // Prevent concurrent health checks
    if (isCheckingRef.current) return;
    
    isCheckingRef.current = true;
    setLoading(true);
    
    try {
      await entityAPI.healthCheck();
      setStatus('healthy');
      toast.success('API is healthy!');
    } catch (error) {
      setStatus('error');
      toast.error('Connection failed');
    } finally {
      setLoading(false);
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    // Use a ref to track if health check has been performed
    const controller = new AbortController();
    const signal = controller.signal;
    
    const performHealthCheck = async () => {
      try {
        if (!signal.aborted) {
          await checkHealth();
        }
      } catch (error) {
        // Error handling is done in checkHealth
      }
    };
    
    performHealthCheck();
    
    // Cleanup function to abort any in-progress requests
    return () => {
      controller.abort();
    };
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return '#10b981'; // green
      case 'error':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'healthy':
        return '✅ API Healthy';
      case 'error':
        return '❌ Connection Failed';
      default:
        return '❓ Checking...';
    }
  };

  const getStatusClasses = () => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={checkHealth}
        disabled={loading}
        className={`inline-flex items-center gap-1 px-2 py-1 border rounded text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm ${getStatusClasses()} ${
          status === 'healthy' ? 'focus:ring-green-500' : status === 'error' ? 'focus:ring-red-500' : 'focus:ring-gray-500'
        }`}
        title={getStatusText()}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
            <span>Check</span>
          </>
        ) : (
          <span className="truncate">
            {status === 'healthy' ? '✅ API' : status === 'error' ? '❌ API' : '❓ API'}
          </span>
        )}
      </button>
    </div>
  );
};

export default HealthCheck;
