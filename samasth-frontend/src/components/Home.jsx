import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import EntityManagementPage from './EntityManagementPage';
import PartnersManagement from './PartnersManagement';
import StockManagementPage from './StockManagementPage';
import SearchPage from './SearchPage';
import SalePage from './SalePage';
import CustomerDisplayPage from './CustomerDisplayPage';
import HealthCheck from './HealthCheck';
import CouponManagementPage from './CouponManagementPage';
import UserManagementPage from './admin/UserManagementPage';
import { UserManagementRoute } from './auth/ProtectedRoute';
import CustomStickerPrintPage from './CustomStickerPrint';
import GenerateCustomPrint from './GenerateCustomPrint';

const Home = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Customer display runs full-screen without sidebar
  if (location.pathname === '/customer-display') {
    return <CustomerDisplayPage />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        
        {/* Page Content */}
        <div className="h-screen overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<EntityManagementPage />} />
            <Route path="/partners" element={<PartnersManagement />} />
            <Route path="/stock" element={<StockManagementPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/sales" element={<SalePage />} />
            <Route path="/customer-display" element={<CustomerDisplayPage />} />
            <Route path="/generate-coupon" element={<CouponManagementPage />} />
            <Route path="/custom-sticker-print" element={<CustomStickerPrintPage />} />
            <Route path="/generate-custom-print" element={<GenerateCustomPrint />} />
            <Route path="/admin-users" element={
              <UserManagementRoute>
                <UserManagementPage />
              </UserManagementRoute>
            } />
            <Route path="/reports" element={
              <div className="p-8">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">📊</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Reports Page</h2>
                  <p className="text-gray-600">Advanced reporting features coming soon!</p>
                </div>
              </div>
            } />
            <Route path="/settings" element={
              <div className="p-8">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                  <div className="mb-4">
                    <span className="text-6xl">⚙️</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings Page</h2>
                  <p className="text-gray-600">Configuration options coming soon!</p>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Home;