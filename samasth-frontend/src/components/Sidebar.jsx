import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  TicketIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UsersIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { user, logout, canManageUsers, canAccessReports, isAdmin } = useAuth();
  const { t } = useLocalization();

  const allMenuItems = [
    { path: '/', icon: HomeIcon, labelKey: 'navigation.dashboard', emoji: '🏠', permission: null },
    { path: '/items', icon: CubeIcon, labelKey: 'navigation.entityManagement', emoji: '🏢', permission: null },
    { path: '/partners', icon: UsersIcon, labelKey: 'navigation.businessPartners', emoji: '🤝', permission: null },
    { path: '/stock', icon: CubeIcon, labelKey: 'navigation.stockManagement', emoji: '📦', permission: null },
    { path: '/search', icon: MagnifyingGlassIcon, labelKey: 'navigation.search', emoji: '🔍', permission: null },
    { path: '/sales', icon: CurrencyDollarIcon, labelKey: 'navigation.sales', emoji: '💰', permission: null },
    { path: '/generate-coupon', icon: TicketIcon, labelKey: 'navigation.generateCoupon', emoji: '🎫', permission: null },
    { path: '/generate-custom-print', icon: PrinterIcon, labelKey: 'navigation.generateCustomPrint', emoji: '🏷️', permission: null },
    { path: '/reports', icon: ChartBarIcon, labelKey: 'navigation.reports', emoji: '📊', permission: 'reports' },
    { path: '/admin-users', icon: UsersIcon, labelKey: 'navigation.userManagement', emoji: '👥', permission: 'admin' },
    { path: '/settings', icon: Cog6ToothIcon, labelKey: 'navigation.settings', emoji: '⚙️', permission: null }
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    if (!item.permission) return true;

    switch (item.permission) {
      case 'admin':
        return canManageUsers();
      case 'reports':
        return canAccessReports();
      default:
        return true;
    }
  });

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = async () => {
    if (window.confirm(t('common.confirmLogout'))) {
      await logout();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200
        shadow-lg transform transition-all duration-300 ease-in-out z-50
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isCollapsed ? 'lg:w-16' : 'lg:w-64'}
      `}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-gray-200`}>
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <span className="text-lg font-bold text-white">📊</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Samasth
                </h2>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className={`sidebar-toggle p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors duration-200 ${isCollapsed ? 'mx-auto' : ''
              }`}
          >
            {isCollapsed ? (
              <Bars3Icon className="w-5 h-5" />
            ) : (
              <XMarkIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative
                      ${isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {!isCollapsed && (
                      <>
                        <span className="flex-1 font-medium truncate text-sm">
                          {t(item.labelKey)}
                        </span>
                        {isActive && (
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        )}
                      </>
                    )}
                  </Link>

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="group-hover:block hidden absolute left-16 bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap z-60 shadow-lg">
                      {t(item.labelKey)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-4 left-2 right-2">
          {!isCollapsed ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {(user?.g_fullname || user?.g_username || 'Guest').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.g_fullname || user?.g_username || 'Guest User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.g_role || 'Not logged in'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  {t('navigation.logout')}
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-2">
              {/* Collapsed user avatar */}
              <div className="flex justify-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {(user?.g_fullname || user?.g_username || 'Guest').charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Collapsed logout button */}
              <button
                onClick={handleLogout}
                className="w-full flex justify-center p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                title={t('navigation.logout')}
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;