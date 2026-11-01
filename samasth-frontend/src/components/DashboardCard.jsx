import React from 'react';

const DashboardCard = ({ 
  title, 
  value, 
  icon, 
  subtitle, 
  trend, 
  trendValue, 
  onRefresh, 
  loading, 
  error,
  color = 'blue',
  children 
}) => {
  const colorVariants = {
    blue: {
      bg: 'bg-gray-50',
      iconBg: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-gray-200'
    },
    green: {
      bg: 'bg-gray-50',
      iconBg: 'bg-green-600',
      text: 'text-green-600',
      border: 'border-gray-200'
    },
    purple: {
      bg: 'bg-gray-50',
      iconBg: 'bg-purple-600',
      text: 'text-purple-600',
      border: 'border-gray-200'
    },
    orange: {
      bg: 'bg-gray-50',
      iconBg: 'bg-orange-600',
      text: 'text-orange-600',
      border: 'border-gray-200'
    },
    red: {
      bg: 'bg-gray-50',
      iconBg: 'bg-red-600',
      text: 'text-red-600',
      border: 'border-gray-200'
    },
    indigo: {
      bg: 'bg-gray-50',
      iconBg: 'bg-indigo-600',
      text: 'text-indigo-600',
      border: 'border-gray-200'
    }
  };

  const colors = colorVariants[color] || colorVariants.blue;

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${colors.iconBg} rounded-md flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-lg">{icon}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs text-gray-500 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Refresh data"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">⚠️</div>
            <p className="text-red-600 font-medium text-sm mb-1">Error loading data</p>
            <p className="text-xs text-gray-500">{error}</p>
          </div>
        ) : loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-600 mx-auto mb-3"></div>
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        ) : (
          <>
            {/* Main Value */}
            {value !== undefined && (
              <div className="mb-3">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {value}
                </div>
                {trend && trendValue && (
                  <div className={`flex items-center gap-1 text-xs ${getTrendColor(trend)}`}>
                    <span>{getTrendIcon(trend)}</span>
                    <span className="font-medium">{trendValue}</span>
                    <span className="text-gray-400">vs last period</span>
                  </div>
                )}
              </div>
            )}

            {/* Custom Content */}
            {children && (
              <div className="text-sm">
                {children}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;