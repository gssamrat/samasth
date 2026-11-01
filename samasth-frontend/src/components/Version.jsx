import React, { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import LanguageSelector from './common/LanguageSelector';

const Version = () => {
  const [showDetails, setShowDetails] = useState(false);

  // Get version info from Vite's define
  const version = __APP_VERSION__;
  const buildDate = __BUILD_DATE__;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-end gap-2">
        {/* Language Selector */}
        <div>
          <LanguageSelector variant="compact" position="top-right" />
        </div>
        
        {/* Version Information */}
        <div className="relative">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-1 bg-gray-800 text-white px-2 py-1 rounded-md text-xs hover:bg-gray-700 transition-colors"
            title="Version Information"
          >
            <InformationCircleIcon className="w-4 h-4" />
            <span>v{version}</span>
          </button>

        {showDetails && (
          <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-64 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Version:</span>
                <span className="text-gray-800">v{version}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Environment:</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  isDevelopment 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {isDevelopment ? 'Development' : 'Production'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">API URL:</span>
                <span className="text-gray-800 text-xs font-mono break-all">
                  {apiBaseUrl}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Build Date:</span>
                <span className="text-gray-800 text-xs">
                  {new Date(buildDate).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Build Time:</span>
                <span className="text-gray-800 text-xs">
                  {new Date(buildDate).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Version;
