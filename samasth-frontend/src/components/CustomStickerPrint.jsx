import React, { useState, useEffect } from 'react';
import { 
  TicketIcon,
  SparklesIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import SequentialCouponForm from './coupon/SequentialCouponForm';
import FlashCouponForm from './coupon/FlashCouponForm';
import EntryModeSelector from './common/EntryModeSelector';
import { entityAPI } from '../services/api';

const CustomStickerPrint = () => {
  const [activeTab, setActiveTab] = useState('generate-coupon');
  const [entryMode, setEntryMode] = useState('flash'); // 'sequential' or 'flash'
  const [recentCoupon, setRecentCoupon] = useState(null);
  const [couponStats, setCouponStats] = useState({
    totalCoupons: 0,
    todaysCoupons: 0,
    totalValue: 0,
    recentCoupons: []
  });

  useEffect(() => {
    fetchCouponStats();
  }, []);

  const fetchCouponStats = async () => {
    try {
      // Fetch coupon count
      const totalCoupons = await entityAPI.fetchCouponsCount();
      
      // You can expand this to fetch more detailed stats from your API
      setCouponStats(prev => ({
        ...prev,
        totalCoupons,
        todaysCoupons: 0, // This would need a separate API call
        totalValue: 0, // This would need calculation from coupon data
        recentCoupons: [] // This would need recent coupon data
      }));
    } catch (error) {
      console.error('Error fetching coupon stats:', error);
    }
  };

  const handleCouponGenerated = (couponData) => {
    setRecentCoupon(couponData);
    fetchCouponStats(); // Refresh stats
    //toast.success('Coupon generated and printed successfully!');
  };

  const tabs = [
    {
      id: 'generate-coupon',
      label: 'Generate Coupon',
      icon: TicketIcon,
      description: 'Create new customer coupons'
    },
    {
      id: 'coupon-history',
      label: 'Coupon History',
      icon: ClipboardDocumentListIcon,
      description: 'View generated coupons and history'
    },
    {
      id: 'overview',
      label: 'Overview',
      icon: ChartBarIcon,
      description: 'Coupon statistics and analytics'
    }
  ];

  const renderCouponForm = (mode) => {
    if (mode === 'flash') {
      return <FlashCouponForm onCouponGenerated={handleCouponGenerated} />;
    } else {
      return <SequentialCouponForm onCouponGenerated={handleCouponGenerated} />;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'generate-coupon':
        return (
          <div>
            <EntryModeSelector
              selectedMode={entryMode}
              onModeChange={setEntryMode}
              modes={['sequential', 'flash']}
              customDescriptions={{
                sequential: '📝 Traditional step-by-step coupon generation form',
                flash: '⚡ Lightning-fast coupon generation with individual flash modals'
              }}
              className="mb-6"
            />
            {renderCouponForm(entryMode)}
          </div>
        );
        
      case 'coupon-history':
        return (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ClipboardDocumentListIcon className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Coupon History</h2>
                  <p className="text-blue-100 mt-1">
                    View and manage generated coupons
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="text-center py-12 text-gray-500">
                <ClipboardDocumentListIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Coupon History Coming Soon</h3>
                <p className="text-sm">This feature will show detailed coupon history and management options.</p>
              </div>
            </div>
          </div>
        );
        
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Coupon Statistics */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <TicketIcon className="w-5 h-5 text-white" />
                  </div>
                  Coupon Overview
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                    <div className="text-2xl font-bold">{couponStats.totalCoupons}</div>
                    <div className="text-purple-100">Total Coupons Issued</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg p-4 text-white">
                    <div className="text-2xl font-bold">{couponStats.todaysCoupons}</div>
                    <div className="text-pink-100">Today's Coupons</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-4 text-white">
                    <div className="text-2xl font-bold">${couponStats.totalValue.toFixed(2)}</div>
                    <div className="text-indigo-100">Total Coupon Value</div>
                  </div>
                </div>
                
                {recentCoupon && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-green-900 mb-2">Recently Generated Coupon</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-green-800">Coupon ID:</span>
                        <span className="ml-2 text-green-700">{recentCoupon.couponId}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Customer:</span>
                        <span className="ml-2 text-green-700">{recentCoupon.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Mobile:</span>
                        <span className="ml-2 text-green-700">{recentCoupon.mobile}</span>
                      </div>
                      <div>
                        <span className="font-medium text-green-800">Copies Printed:</span>
                        <span className="ml-2 text-green-700">{recentCoupon.copies}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
              <TicketIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
              <p className="text-gray-600 mt-0.5 text-sm">Generate and manage customer coupons</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-lg border border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
          
          {/* Tab Description */}
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {renderTabContent()}
        </div>

        {/* Recent Coupon Quick Info */}
        {recentCoupon && activeTab !== 'overview' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-purple-900">Recent Coupon Generated</h4>
                <p className="text-sm text-purple-700">
                  {recentCoupon.couponId} - {recentCoupon.copies} copies printed
                </p>
              </div>
              <button
                onClick={() => setActiveTab('overview')}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 text-sm font-medium"
              >
                <ChartBarIcon className="w-4 h-4" />
                View Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomStickerPrint;