import React, { useState, useEffect } from 'react';
import { 
  CubeIcon, 
  PrinterIcon, 
  ClipboardDocumentListIcon,
  PlusIcon,
  ChartBarIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import StockEntryForm from './stock/StockEntryForm';
import FlashStockEntryForm from './stock/FlashStockEntryForm';
import BulkStockEntryForm from './stock/BulkStockEntryForm';
import EditStockPricesForm from './stock/EditStockPricesForm';
import StickerTemplateDesigner from './stickers/StickerTemplateDesigner';
import PrintJobManager from './stickers/PrintJobManager';
import EntryModeSelector from './common/EntryModeSelector';
import { stockAPI, stickerAPI } from '../services/api';

const StockManagementPage = () => {
  const [activeTab, setActiveTab] = useState('add-stock');
  const [entryMode, setEntryMode] = useState('flash'); // 'tab' or 'flash'
  const [recentStockEntry, setRecentStockEntry] = useState(null);
  const [stockStats, setStockStats] = useState({
    totalEntries: 0,
    totalValue: 0,
    lowStock: 0,
    recentEntries: []
  });
  const [printStats, setPrintStats] = useState(null);
  const [allStockRecords, setAllStockRecords] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);

  useEffect(() => {
    fetchStockStats();
    fetchPrintStats();
  }, []);

  // Fetch stock records when view-stock tab is accessed
  useEffect(() => {
    if (activeTab === 'view-stock') {
      fetchAllStockRecords();
    }
  }, [activeTab]);

  const fetchStockStats = async () => {
    try {
      const stockData = await stockAPI.getAllStock();
      const totalEntries = stockData.length;
      const totalValue = stockData.reduce((sum, item) => {
        const purchaseValue = item.s_purchase_value || 0;
        const quantity = item.s_qty || 0;
        return sum + (purchaseValue * quantity);
      }, 0);
      const recentEntries = stockData
        .sort((a, b) => new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at))
        .slice(0, 5);

      // Calculate low stock (items with quantity less than 10)
      const lowStock = stockData.filter(item => (item.s_qty || 0) < 10).length;

      setStockStats({
        totalEntries,
        totalValue,
        lowStock,
        recentEntries
      });
    } catch (error) {
      console.error('Error fetching stock stats:', error);
    }
  };

  const fetchPrintStats = async () => {
    try {
      const stats = await stickerAPI.getStats();
      setPrintStats(stats);
    } catch (error) {
      console.error('Error fetching print stats:', error);
    }
  };

  const fetchAllStockRecords = async () => {
    setStockLoading(true);
    try {
      const stockData = await stockAPI.getAllStock();
      // Ensure we always set an array, even if API returns null/undefined/non-array
      setAllStockRecords(Array.isArray(stockData) ? stockData : []);
    } catch (error) {
      console.error('Error fetching all stock records:', error);
      toast.error('Failed to fetch stock records');
      // Set empty array on error
      setAllStockRecords([]);
    } finally {
      setStockLoading(false);
    }
  };

  const handleStockAdded = (stockData) => {
    setRecentStockEntry(stockData);
    fetchStockStats(); // Refresh stats
    toast.success('Stock added successfully! You can now print stickers for this item.');
    
    // Auto-switch to sticker tab if user wants to print immediately
    setTimeout(() => {
      if (window.confirm('Would you like to print stickers for this stock entry?')) {
        setActiveTab('print-stickers');
      }
    }, 1000);
  };

  const handlePrintJobCreated = (jobData) => {
    fetchPrintStats(); // Refresh print stats
    toast.success(`Print job created! Job ID: ${jobData.jobId}`);
  };

  const tabs = [
    {
      id: 'add-stock',
      label: 'Add Stock',
      icon: PlusIcon,
      description: 'Add new stock entries for products'
    },
    {
      id: 'view-stock',
      label: 'View Stock',
      icon: CubeIcon,
      description: 'View all stock inventory records'
    },
    {
      id: 'edit-prices',
      label: 'Edit Prices',
      icon: PencilIcon,
      description: 'Search and edit stock prices and details'
    },
    {
      id: 'print-stickers',
      label: 'Print Stickers',
      icon: PrinterIcon,
      description: 'Design and print product stickers'
    },
    {
      id: 'print-jobs',
      label: 'Print Jobs',
      icon: ClipboardDocumentListIcon,
      description: 'Manage print job queue'
    },
    {
      id: 'overview',
      label: 'Overview',
      icon: ChartBarIcon,
      description: 'Stock and printing statistics'
    }
  ];

  const renderStockForm = (mode) => {
    if (mode === 'flash') {
      return <FlashStockEntryForm onStockAdded={handleStockAdded} />;
    } else if (mode === 'bulk') {
      return <BulkStockEntryForm onStockAdded={handleStockAdded} />;
    } else {
      return <StockEntryForm onStockAdded={handleStockAdded} />;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
        case 'add-stock':
        return (
          <div>
            <EntryModeSelector
              selectedMode={entryMode}
              onModeChange={setEntryMode}
              modes={['sequential', 'flash', 'bulk']}
              customDescriptions={{
                sequential: '📝 Step-by-step sequential form with all fields visible',
                flash: '⚡ Lightning-fast entry with individual flash modals for each field',
                bulk: '📦 Add multiple items to a table, then save all at once'
              }}
              className="mb-6"
            />
            {renderStockForm(entryMode)}
          </div>
        );

      case 'view-stock':
        return (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <CubeIcon className="w-5 h-5 text-white" />
                  </div>
                  Stock Inventory Records
                </h2>
                <button
                  onClick={fetchAllStockRecords}
                  disabled={stockLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {stockLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    'Refresh'
                  )}
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {stockLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading stock records...</span>
                </div>
              ) : (!Array.isArray(allStockRecords) || allStockRecords.length === 0) ? (
                <div className="text-center py-12">
                  <CubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No stock records found</p>
                  <button
                    onClick={fetchAllStockRecords}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Load Stock Records
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Stock ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Barcode</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Entity ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Manufacturer</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Supplier</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Batch No</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">MRP</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Purchase</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Sale</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Qty</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Expiry</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Array.isArray(allStockRecords) ? allStockRecords.map((record) => (
                        <tr key={record.s_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.s_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{record.s_barcode || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{record.s_eid || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{record.s_bp_man_id || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{record.s_bp_sup_id || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{record.s_batchno || '-'}</td>
                          <td className="px-4 py-3 text-sm text-right">₹{(record.s_mrp || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right">₹{(record.s_purchase_value || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right">₹{(record.s_sale_value || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-center font-medium">{record.s_qty || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.s_expirydt ? new Date(record.s_expirydt).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {record.created_at ? new Date(record.created_at).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="12" className="px-4 py-8 text-center text-gray-500">
                            No stock records available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'edit-prices':
        return <EditStockPricesForm />;
        
      case 'print-stickers':
        return (
          <StickerTemplateDesigner 
            stockData={recentStockEntry} 
            onPrint={handlePrintJobCreated}
          />
        );
        
      case 'print-jobs':
        return <PrintJobManager />;
        
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stock Statistics */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <CubeIcon className="w-5 h-5 text-white" />
                  </div>
                  Stock Overview
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                    <div className="text-2xl font-bold">{stockStats.totalEntries}</div>
                    <div className="text-blue-100">Total Stock Entries</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                    <div className="text-2xl font-bold">${stockStats.totalValue.toFixed(2)}</div>
                    <div className="text-green-100">Total Stock Value</div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                    <div className="text-2xl font-bold">{stockStats.lowStock}</div>
                    <div className="text-orange-100">Low Stock Alerts</div>
                  </div>
                </div>
                
                {stockStats.recentEntries.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Stock Entries</h3>
                    <div className="space-y-3">
                      {stockStats.recentEntries.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">
                              Stock ID: {entry.s_id}
                            </div>
                            <div className="text-sm text-gray-600">
                              Quantity: {entry.s_qty || 0} | Purchase: ${entry.s_purchase_value || 0}
                              {entry.s_barcode && <span> | Barcode: {entry.s_barcode}</span>}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Print Statistics */}
            {printStats && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <PrinterIcon className="w-5 h-5 text-white" />
                    </div>
                    Printing Overview
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{printStats.total || 0}</div>
                      <div className="text-sm text-gray-600">Total Jobs</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{printStats.pending || 0}</div>
                      <div className="text-sm text-gray-600">Pending</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{printStats.printing || 0}</div>
                      <div className="text-sm text-gray-600">Printing</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{printStats.completed || 0}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg">
              <CubeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
              <p className="text-gray-600 mt-0.5 text-sm">Manage inventory and print product stickers</p>
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
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
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

        {/* Quick Actions */}
        {recentStockEntry && activeTab !== 'print-stickers' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Recent Stock Entry</h4>
                <p className="text-sm text-blue-700">
                  {recentStockEntry.product_name} - {recentStockEntry.quantity} units added
                </p>
              </div>
              <button
                onClick={() => setActiveTab('print-stickers')}
                className="btn-primary flex items-center gap-2"
              >
                <PrinterIcon className="w-4 h-4" />
                Print Stickers
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockManagementPage;
