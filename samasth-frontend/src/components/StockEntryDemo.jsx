import React from 'react';
import StockEntryForm from './stock/StockEntryForm';

const StockEntryDemo = () => {
  const handleStockAdded = (stockData) => {
    console.log('Stock added:', stockData);
    alert(`Stock added successfully! ${JSON.stringify(stockData, null, 2)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Stock Entry Demo
          </h1>
          <p className="text-lg text-gray-600">
            Experience the new sequential, keyboard-friendly stock entry workflow
          </p>
        </div>

        {/* Demo Features */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🔍 Auto-Fill Search</h3>
              <p className="text-gray-600 text-sm">Type 2+ characters and get instant search results from the API</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">⌨️ Keyboard Navigation</h3>
              <p className="text-gray-600 text-sm">Arrow keys to navigate, Enter to select, Esc to close</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Sequential Flow</h3>
              <p className="text-gray-600 text-sm">Clear step-by-step progress through each field</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">⚡ Debounced API</h3>
              <p className="text-gray-600 text-sm">Smart 300ms delay to reduce unnecessary API calls</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <StockEntryForm onStockAdded={handleStockAdded} />

        {/* Instructions */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Use the Auto-Fill Search:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li><strong>Start typing</strong> - Enter at least 2 characters in the search box</li>
              <li><strong>Watch the magic</strong> - Auto-fill dropdown appears with matching products</li>
              <li><strong>Navigate with keyboard</strong> - Use ↑↓ arrow keys to highlight options</li>
              <li><strong>Select</strong> - Press Enter or click to select a product</li>
              <li><strong>Continue</strong> - Click "Continue" to start entering stock details</li>
              <li><strong>Fill sequentially</strong> - Press Enter to move through each field</li>
              <li><strong>Save</strong> - Choose to save normally or add to print job</li>
            </ol>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">✨ Auto-Fill Features:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Debounced search:</strong> 300ms delay prevents excessive API calls</li>
                <li>• <strong>Real-time filtering:</strong> Searches both product name and code</li>
                <li>• <strong>Keyboard navigation:</strong> Full keyboard support for accessibility</li>
                <li>• <strong>Visual feedback:</strong> Loading, success, and error states</li>
                <li>• <strong>Click outside:</strong> Dropdown closes when clicking elsewhere</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockEntryDemo;