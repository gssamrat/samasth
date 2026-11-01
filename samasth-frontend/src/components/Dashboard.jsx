import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DashboardCard from './DashboardCard';
import { dashboardAPI } from '../services/api';

const Dashboard = () => {
  // Dashboard state
  const [dashboardData, setDashboardData] = useState({
    sales: { loading: false, error: null, data: null },
    inventory: { loading: false, error: null, data: null },
    todos: { loading: false, error: null, data: null },
    financial: { loading: false, error: null, data: null },
    customers: { loading: false, error: null, data: null },
    suppliers: { loading: false, error: null, data: null },
    lowStock: { loading: false, error: null, data: null },
    topProducts: { loading: false, error: null, data: null }
  });

  // Generic function to update dashboard data
  const updateDashboardSection = (section, updates) => {
    setDashboardData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }));
  };

  // Generic fetch function for dashboard sections
  const fetchDashboardData = async (section, apiCall, successMessage = null) => {
    updateDashboardSection(section, { loading: true, error: null });
    try {
      const data = await apiCall();
      updateDashboardSection(section, { loading: false, data });
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (error) {
      console.error(`Error fetching ${section}:`, error);
      updateDashboardSection(section, { 
        loading: false, 
        error: error.message || `Failed to load ${section} data` 
      });
    }
  };

  // Individual fetch functions for each dashboard section
  const fetchSales = () => fetchDashboardData('sales', () => dashboardAPI.getSalesStats(), 'Sales data refreshed');
  const fetchInventory = () => fetchDashboardData('inventory', () => dashboardAPI.getInventoryStats(), 'Inventory data refreshed');
  const fetchTodos = () => fetchDashboardData('todos', () => dashboardAPI.getTodoStats(), 'Todo data refreshed');
  const fetchFinancial = () => fetchDashboardData('financial', () => dashboardAPI.getFinancialStats(), 'Financial data refreshed');
  const fetchCustomers = () => fetchDashboardData('customers', () => dashboardAPI.getCustomerStats(), 'Customer data refreshed');
  const fetchSuppliers = () => fetchDashboardData('suppliers', () => dashboardAPI.getSupplierStats(), 'Supplier data refreshed');
  const fetchLowStock = () => fetchDashboardData('lowStock', () => dashboardAPI.getLowStockAlerts(), 'Stock alerts refreshed');
  const fetchTopProducts = () => fetchDashboardData('topProducts', () => dashboardAPI.getTopProducts(), 'Top products refreshed');

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      // Load all dashboard data on component mount
      await Promise.all([
        fetchDashboardData('sales', () => dashboardAPI.getSalesStats()),
        fetchDashboardData('inventory', () => dashboardAPI.getInventoryStats()),
        fetchDashboardData('todos', () => dashboardAPI.getTodoStats()),
        fetchDashboardData('financial', () => dashboardAPI.getFinancialStats()),
        fetchDashboardData('customers', () => dashboardAPI.getCustomerStats()),
        fetchDashboardData('suppliers', () => dashboardAPI.getSupplierStats()),
        fetchDashboardData('lowStock', () => dashboardAPI.getLowStockAlerts()),
        fetchDashboardData('topProducts', () => dashboardAPI.getTopProducts())
      ]);
    };

    loadInitialData();
  }, []);
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR' 
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Comprehensive overview of your business metrics</p>
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          
          {/* Sales Statistics Card */}
          <DashboardCard
            title="Sales Overview"
            subtitle="Last 30 days"
            icon="💰"
            color="green"
            value={formatCurrency(dashboardData.sales.data?.total_sales)}
            trend={dashboardData.sales.data?.trend}
            trendValue={dashboardData.sales.data?.trend_percentage && `${dashboardData.sales.data.trend_percentage}%`}
            onRefresh={fetchSales}
            loading={dashboardData.sales.loading}
            error={dashboardData.sales.error}
          >
            {dashboardData.sales.data && (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-600">Orders:</span>
                  <span className="font-medium text-gray-900">{formatNumber(dashboardData.sales.data.total_orders)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Order:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(dashboardData.sales.data.avg_order_value)}</span>
                </div>
              </div>
            )}
          </DashboardCard>

          {/* Inventory Statistics Card */}
          <DashboardCard
            title="Inventory Status"
            subtitle="Current stock levels"
            icon="📦"
            color="blue"
            value={formatNumber(dashboardData.inventory.data?.total_items)}
            onRefresh={fetchInventory}
            loading={dashboardData.inventory.loading}
            error={dashboardData.inventory.error}
          >
            {dashboardData.inventory.data && (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Value:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(dashboardData.inventory.data.total_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Categories:</span>
                  <span className="font-medium text-gray-900">{formatNumber(dashboardData.inventory.data.total_categories)}</span>
                </div>
              </div>
            )}
          </DashboardCard>

          {/* Stock Shortages Card */}
          <DashboardCard
            title="Stock Alerts"
            subtitle="Low stock items"
            icon="⚠️"
            color="red"
            value={formatNumber(dashboardData.lowStock.data?.count)}
            onRefresh={fetchLowStock}
            loading={dashboardData.lowStock.loading}
            error={dashboardData.lowStock.error}
          >
            {dashboardData.lowStock.data?.items && dashboardData.lowStock.data.items.length > 0 ? (
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {dashboardData.lowStock.data.items.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-700 truncate text-xs">{item.name}</span>
                    <span className="font-medium text-red-600 text-xs flex-shrink-0 ml-2">{item.quantity} left</span>
                  </div>
                ))}
                {dashboardData.lowStock.data.items.length > 4 && (
                  <div className="text-xs text-gray-500 text-center pt-1 border-t border-gray-100">
                    +{dashboardData.lowStock.data.items.length - 4} more items
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-green-600 text-xs font-medium py-2">
                ✅ All items well stocked
              </div>
            )}
          </DashboardCard>

          {/* Todo/Tasks Card */}
          <DashboardCard
            title="Pending Tasks"
            subtitle="Action items"
            icon="✅"
            color="purple"
            value={formatNumber(dashboardData.todos.data?.pending_count)}
            onRefresh={fetchTodos}
            loading={dashboardData.todos.loading}
            error={dashboardData.todos.error}
          >
            {dashboardData.todos.data && (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-600">High Priority:</span>
                  <span className="font-medium text-red-600">{formatNumber(dashboardData.todos.data.high_priority)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed Today:</span>
                  <span className="font-medium text-green-600">{formatNumber(dashboardData.todos.data.completed_today)}</span>
                </div>
              </div>
            )}
          </DashboardCard>

          {/* Financial Summary Card */}
          <DashboardCard
            title="Financial Summary"
            subtitle="This month"
            icon="💹"
            color="indigo"
            value={formatCurrency(dashboardData.financial.data?.revenue)}
            trend={dashboardData.financial.data?.revenue_trend}
            trendValue={dashboardData.financial.data?.revenue_trend_percentage && `${dashboardData.financial.data.revenue_trend_percentage}%`}
            onRefresh={fetchFinancial}
            loading={dashboardData.financial.loading}
            error={dashboardData.financial.error}
          >
            {dashboardData.financial.data && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Profit:</span>
                  <span className="font-medium text-green-600">{formatCurrency(dashboardData.financial.data.profit)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expenses:</span>
                  <span className="font-medium text-red-600">{formatCurrency(dashboardData.financial.data.expenses)}</span>
                </div>
              </div>
            )}
          </DashboardCard>

          {/* Customer Statistics Card */}
          <DashboardCard
            title="Customers"
            subtitle="Customer base"
            icon="👥"
            color="green"
            value={formatNumber(dashboardData.customers.data?.total_customers)}
            trend={dashboardData.customers.data?.trend}
            trendValue={dashboardData.customers.data?.new_customers_this_month && `+${dashboardData.customers.data.new_customers_this_month} this month`}
            onRefresh={fetchCustomers}
            loading={dashboardData.customers.loading}
            error={dashboardData.customers.error}
          >
            {dashboardData.customers.data && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-medium">{formatNumber(dashboardData.customers.data.active_customers)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">New This Week:</span>
                  <span className="font-medium text-green-600">{formatNumber(dashboardData.customers.data.new_customers_this_week)}</span>
                </div>
              </div>
            )}
          </DashboardCard>

          {/* Supplier Statistics Card */}
          <DashboardCard
            title="Suppliers"
            subtitle="Supply chain"
            icon="🏭"
            color="orange"
            value={formatNumber(dashboardData.suppliers.data?.total_suppliers)}
            onRefresh={fetchSuppliers}
            loading={dashboardData.suppliers.loading}
            error={dashboardData.suppliers.error}
          >
            {dashboardData.suppliers.data && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-medium">{formatNumber(dashboardData.suppliers.data.active_suppliers)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Orders Pending:</span>
                  <span className="font-medium text-orange-600">{formatNumber(dashboardData.suppliers.data.pending_orders)}</span>
                </div>
              </div>
            )}
          </DashboardCard>

          {/* Top Products Card */}
          <DashboardCard
            title="Top Products"
            subtitle="Best sellers"
            icon="🏆"
            color="purple"
            onRefresh={fetchTopProducts}
            loading={dashboardData.topProducts.loading}
            error={dashboardData.topProducts.error}
          >
            {dashboardData.topProducts.data?.products && dashboardData.topProducts.data.products.length > 0 ? (
              <div className="space-y-2 max-h-28 overflow-y-auto">
                {dashboardData.topProducts.data.products.slice(0, 3).map((product, index) => (
                  <div key={index} className="">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-gray-800 truncate text-xs">{product.name}</div>
                      <div className="font-medium text-xs ml-2 flex-shrink-0">{formatCurrency(product.revenue)}</div>
                    </div>
                    <div className="text-gray-500 text-xs">{formatNumber(product.quantity_sold)} sold</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-xs py-2">
                📊 No sales data available
              </div>
            )}
          </DashboardCard>

        </div>

        {/* Quick Actions Section */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-lg">⚡</span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            <button className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
              <div className="text-lg mb-1">➕</div>
              <div className="text-xs font-medium text-gray-700 text-center">Add Product</div>
            </button>
            <button className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
              <div className="text-lg mb-1">🛒</div>
              <div className="text-xs font-medium text-gray-700 text-center">New Order</div>
            </button>
            <button className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
              <div className="text-lg mb-1">👤</div>
              <div className="text-xs font-medium text-gray-700 text-center">Add Customer</div>
            </button>
            <button className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
              <div className="text-lg mb-1">📊</div>
              <div className="text-xs font-medium text-gray-700 text-center">View Reports</div>
            </button>
            <button className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
              <div className="text-lg mb-1">🏢</div>
              <div className="text-xs font-medium text-gray-700 text-center">Add Supplier</div>
            </button>
            <button className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
              <div className="text-lg mb-1">📋</div>
              <div className="text-xs font-medium text-gray-700 text-center">Manage Tasks</div>
            </button>
            <button className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
              <div className="text-lg mb-1">📈</div>
              <div className="text-xs font-medium text-gray-700 text-center">Analytics</div>
            </button>
            <button className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
              <div className="text-lg mb-1">⚙️</div>
              <div className="text-xs font-medium text-gray-700 text-center">Settings</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
