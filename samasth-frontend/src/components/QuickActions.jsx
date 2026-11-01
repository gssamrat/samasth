import React, { useState } from 'react';
import toast from 'react-hot-toast';

const QuickActions = ({ onGetStock, onDeleteStock }) => {
  const [stockId, setStockId] = useState('');
  const [deleteId, setDeleteId] = useState('');
  const [stockResult, setStockResult] = useState(null);
  const [loading, setLoading] = useState({ get: false, delete: false });

  const handleGetStock = async () => {
    if (!stockId.trim()) {
      toast.error('Please enter a stock ID');
      return;
    }

    setLoading(prev => ({ ...prev, get: true }));
    try {
      const stock = await onGetStock(stockId);
      setStockResult(stock);
      toast.success('Stock found!');
    } catch (error) {
      setStockResult(null);
    } finally {
      setLoading(prev => ({ ...prev, get: false }));
    }
  };

  const handleDeleteStock = async () => {
    if (!deleteId.trim()) {
      toast.error('Please enter a stock ID');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete stock with ID: ${deleteId}?`)) {
      return;
    }

    setLoading(prev => ({ ...prev, delete: true }));
    try {
      await onDeleteStock(deleteId);
      setDeleteId('');
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          Quick Actions
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Find Stock by ID */}
          <div>
            <h5 className="text-lg font-medium text-gray-900 mb-4">Find Stock by ID</h5>
            <div className="mb-4">
              <input
                type="text"
                value={stockId}
                onChange={(e) => setStockId(e.target.value)}
                placeholder="Enter stock ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-3 focus:ring-primary-100"
              />
            </div>
            <button
              onClick={handleGetStock}
              disabled={loading.get}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading.get ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <span>🔍</span>
                  Find Stock
                </>
              )}
            </button>
            
            {stockResult && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
                <h6 className="font-medium mb-2">Stock Found:</h6>
                <div className="space-y-1 text-xs font-mono">
                  <div><strong>ID:</strong> {stockResult.id}</div>
                  <div><strong>Symbol:</strong> {stockResult.symbol}</div>
                  <div><strong>Name:</strong> {stockResult.name}</div>
                  <div><strong>Price:</strong> ${stockResult.price}</div>
                  <div><strong>Quantity:</strong> {stockResult.quantity}</div>
                  <div><strong>Total Value:</strong> ${(stockResult.price * stockResult.quantity).toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Delete Stock */}
          <div>
            <h5 className="text-lg font-medium text-gray-900 mb-4">Delete Stock</h5>
            <div className="mb-4">
              <input
                type="text"
                value={deleteId}
                onChange={(e) => setDeleteId(e.target.value)}
                placeholder="Enter stock ID to delete"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-primary-500 focus:ring-3 focus:ring-primary-100"
              />
            </div>
            <button
              onClick={handleDeleteStock}
              disabled={loading.delete}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading.delete ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <span>🗑️</span>
                  Delete Stock
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
