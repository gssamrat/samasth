import React, { useState, useEffect, useRef } from 'react';
import { 
  // MagnifyingGlassIcon, 
  CheckIcon, 
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CloudArrowUpIcon,
  TableCellsIcon,
  PencilIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { entityAPI, stockAPI } from '../../services/api';

const BulkStockEntryForm = ({ onStockAdded }) => {
  const [currentEntry, setCurrentEntry] = useState({
    productId: '',
    productName: '',
    productCode: '',
    barcode: '',
    systemBarcode: '',
    manufacturerId: '',
    supplierId: '',
    batchNumber: '',
    manufactureDate: '',
    expiryDate: '',
    mrp: '',
    purchaseRate: '',
    sellingPrice: '',
    quantity: '',
    notes: ''
  });

  // Product search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef(null);

  // Bulk entry states
  const [stockTable, setStockTable] = useState([]);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [bulkSaveMode, setBulkSaveMode] = useState('save'); // 'save' or 'print'

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.search-container')) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const searchEntities = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await entityAPI.searchEntity(query.trim());
      
      // Handle nested response structure from searchEntity
      let entities = [];
      if (Array.isArray(response)) {
        if (response.length > 0 && response[0].resultType === 'Entity' && response[0].results) {
          entities = response[0].results;
        } else {
          entities = response;
        }
      } else if (response && response.results) {
        entities = response.results;
      }
      
      // Filter for products only
      const products = entities.filter(entity => {
        const isProduct = entity.et_id === '1' || entity.et_id === 1 || entity.e_type === 'product' || entity.type === 'product';
        return isProduct;
      });
      
      setSearchResults(products.slice(0, 10));
      setShowDropdown(products.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error searching entities:', error);
      toast.error('Error searching products');
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (value) => {
    setSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!value) {
      setCurrentEntry(prev => ({
        ...prev,
        productId: '',
        productName: '',
        productCode: ''
      }));
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchEntities(value);
    }, 300);
  };

  const selectProduct = (product) => {
    setCurrentEntry(prev => ({
      ...prev,
      productId: product.e_id || product.id,
      productName: product.e_name || product.name,
      productCode: product.e_code || product.code || product.e_barcode
    }));
    setSearchTerm(product.e_name || product.name);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || searchResults.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          selectProduct(searchResults[selectedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
        
      default:
        break;
    }
  };

  const handleInputChange = (field, value) => {
    setCurrentEntry(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateCurrentEntry = () => {
    if (!currentEntry.productId) {
      toast.error('Please select a product');
      return false;
    }
    if (!currentEntry.mrp || parseFloat(currentEntry.mrp) <= 0) {
      toast.error('Please enter a valid MRP');
      return false;
    }
    if (!currentEntry.purchaseRate || parseFloat(currentEntry.purchaseRate) <= 0) {
      toast.error('Please enter a valid purchase rate');
      return false;
    }
    if (!currentEntry.sellingPrice || parseFloat(currentEntry.sellingPrice) <= 0) {
      toast.error('Please enter a valid selling price');
      return false;
    }
    if (!currentEntry.quantity || parseInt(currentEntry.quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return false;
    }
    return true;
  };

  const addToTable = () => {
    if (!validateCurrentEntry()) return;
    
    // Check if product already exists in table
    const existingIndex = stockTable.findIndex(item => item.productId === currentEntry.productId);
    if (existingIndex !== -1) {
      toast.error('Product already exists in the table. Edit the existing entry or remove it first.');
      return;
    }
    
    if (editingIndex >= 0) {
      // Update existing item
      const updatedTable = [...stockTable];
      updatedTable[editingIndex] = { ...currentEntry, id: Date.now() + Math.random() };
      setStockTable(updatedTable);
      setEditingIndex(-1);
      toast.success('Item updated in table');
    } else {
      // Add new item
      const newItem = { ...currentEntry, id: Date.now() + Math.random() };
      setStockTable(prev => [...prev, newItem]);
      toast.success('Item added to table');
    }
    
    // Reset form
    resetCurrentEntry();
  };

  const editTableItem = (index) => {
    const item = stockTable[index];
    setCurrentEntry(item);
    setSearchTerm(item.productName);
    setEditingIndex(index);
    toast.info('Item loaded for editing');
  };

  const duplicateTableItem = (index) => {
    const item = stockTable[index];
    const duplicatedItem = { 
      ...item, 
      id: Date.now() + Math.random(),
      quantity: '', // Clear quantity for new entry
      notes: item.notes ? `${item.notes} (Copy)` : '(Copy)'
    };
    setCurrentEntry(duplicatedItem);
    setSearchTerm(duplicatedItem.productName);
    toast.info('Item duplicated and loaded for editing');
  };

  const removeFromTable = (index) => {
    setStockTable(prev => prev.filter((_, i) => i !== index));
    toast.success('Item removed from table');
  };

  const resetCurrentEntry = () => {
    setCurrentEntry({
      productId: '',
      productName: '',
      productCode: '',
      barcode: '',
      systemBarcode: '',
      manufacturerId: '',
      supplierId: '',
      batchNumber: '',
      manufactureDate: '',
      expiryDate: '',
      mrp: '',
      purchaseRate: '',
      sellingPrice: '',
      quantity: '',
      notes: ''
    });
    setSearchTerm('');
    setEditingIndex(-1);
    setShowDropdown(false);
  };

  const handleBulkSave = async () => {
    if (stockTable.length === 0) {
      toast.error('No items in the table to save');
      return;
    }

    setLoading(true);
    try {
      const stockData = stockTable.map(item => ({
        s_eid: item.productId,
        s_barcode: item.barcode || null,
        s_sysbarcode_1: item.systemBarcode || null,
        s_bp_man_id: item.manufacturerId || null,
        s_bp_sup_id: item.supplierId || null,
        s_batchno: item.batchNumber || null,
        s_manfacture_dt: item.manufactureDate || null,
        s_expirydt: item.expiryDate || null,
        s_mrp: item.mrp ? parseFloat(item.mrp) : null,
        s_purchase_value: item.purchaseRate ? parseFloat(item.purchaseRate) : null,
        s_sale_value: item.sellingPrice ? parseFloat(item.sellingPrice) : null,
        s_qty: item.quantity ? parseInt(item.quantity) : null,
        notes: item.notes || ''
      }));

      // For now, we'll save each item individually
      // In production, you might want a bulk API endpoint
      const results = [];
      for (const item of stockData) {
        const result = await stockAPI.addStock(item);
        results.push(result);
      }

      const addToPrintJob = bulkSaveMode === 'print';
      if (addToPrintJob) {
        toast.success(`${stockTable.length} items saved and added to print job!`);
      } else {
        toast.success(`${stockTable.length} items saved successfully!`);
      }

      // Reset table
      setStockTable([]);
      resetCurrentEntry();

      if (onStockAdded) {
        onStockAdded({ results, addToPrintJob, count: stockTable.length });
      }
    } catch (error) {
      console.error('Error saving bulk stock:', error);
      toast.error(error.response?.data?.message || 'Failed to save some items');
    } finally {
      setLoading(false);
    }
  };

  const clearTable = () => {
    if (window.confirm('Are you sure you want to clear all items from the table?')) {
      setStockTable([]);
      resetCurrentEntry();
      toast.success('Table cleared');
    }
  };

  const getTotalValue = () => {
    return stockTable.reduce((sum, item) => sum + (parseFloat(item.purchaseRate) * parseInt(item.quantity)), 0);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TableCellsIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Bulk Stock Entry</h2>
              <p className="text-emerald-100 mt-0.5 text-sm">
                Add multiple items to the table, then save all at once
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Product Search & Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PlusIcon className="w-5 h-5" />
                {editingIndex >= 0 ? 'Edit Item' : 'Add New Item'}
              </h3>
              
              {/* Product Search */}
              <div className="relative search-container">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Product *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search products by name or code..."
                    className="w-full px-4 py-3 pl-12 pr-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    autoComplete="off"
                  />
                  {/* <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /> */}
                  
                  {/* Status indicators */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {searchLoading && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-500"></div>
                    )}
                    {!searchLoading && currentEntry.productId && (
                      <CheckIcon className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  {/* Dropdown results */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      <div className="py-1">
                        {searchResults.map((product, index) => {
                          const isHighlighted = index === selectedIndex;
                          return (
                            <button
                              key={product.e_id || product.id || index}
                              type="button"
                              onClick={() => selectProduct(product)}
                              className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-b-0 ${
                                isHighlighted 
                                  ? 'bg-emerald-50 border-emerald-100' 
                                  : 'hover:bg-gray-50 focus:bg-emerald-50'
                              }`}
                            >
                              <div className="font-medium text-gray-900 truncate">
                                {product.e_name || product.name || 'Unnamed Product'}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {product.e_weight && <span>Weight: {product.e_weight}kg • </span>}
                                Code: {product.e_code || product.code || product.e_barcode || 'N/A'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Details Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
                  <input
                    type="text"
                    value={currentEntry.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    placeholder="Enter barcode"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">System Barcode</label>
                  <input
                    type="text"
                    value={currentEntry.systemBarcode}
                    onChange={(e) => handleInputChange('systemBarcode', e.target.value)}
                    placeholder="Enter system barcode"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer ID</label>
                  <input
                    type="text"
                    value={currentEntry.manufacturerId}
                    onChange={(e) => handleInputChange('manufacturerId', e.target.value)}
                    placeholder="Enter manufacturer ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supplier ID</label>
                  <input
                    type="text"
                    value={currentEntry.supplierId}
                    onChange={(e) => handleInputChange('supplierId', e.target.value)}
                    placeholder="Enter supplier ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                  <input
                    type="text"
                    value={currentEntry.batchNumber}
                    onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                    placeholder="Enter batch number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manufacture Date</label>
                  <input
                    type="date"
                    value={currentEntry.manufactureDate}
                    onChange={(e) => handleInputChange('manufactureDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={currentEntry.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">MRP *</label>
                  <input
                    type="number"
                    value={currentEntry.mrp}
                    onChange={(e) => handleInputChange('mrp', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Rate *</label>
                  <input
                    type="number"
                    value={currentEntry.purchaseRate}
                    onChange={(e) => handleInputChange('purchaseRate', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price *</label>
                  <input
                    type="number"
                    value={currentEntry.sellingPrice}
                    onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={currentEntry.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="0"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <input
                  type="text"
                  value={currentEntry.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Add to Table Button */}
              <div className="flex gap-3">
                <button
                  onClick={addToTable}
                  className="flex-1 bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  {editingIndex >= 0 ? 'Update in Table' : 'Add to Table'}
                </button>
                
                {(currentEntry.productId || editingIndex >= 0) && (
                  <button
                    onClick={resetCurrentEntry}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Right Column - Table Preview */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TableCellsIcon className="w-5 h-5" />
                  Items to Save ({stockTable.length})
                </h3>
                {stockTable.length > 0 && (
                  <button
                    onClick={clearTable}
                    className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {stockTable.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <TableCellsIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium mb-1">No items added yet</p>
                    <p className="text-sm">Add products to see them listed here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Product</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Barcode</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Batch</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Supplier</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-900">MRP</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-900">Purchase</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-900">Selling</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-900">Qty</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-900">Expiry</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-900">Total</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stockTable.map((item, index) => (
                          <tr key={item.id} className={editingIndex === index ? 'bg-emerald-50' : 'hover:bg-gray-50'}>
                            <td className="px-3 py-2">
                              <div>
                                <div className="font-medium text-gray-900 text-xs">{item.productName}</div>
                                <div className="text-xs text-gray-500">{item.productCode}</div>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">{item.barcode || '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-600">{item.batchNumber || '-'}</td>
                            <td className="px-3 py-2 text-xs text-gray-600">{item.supplierId || '-'}</td>
                            <td className="px-3 py-2 text-right text-xs">₹{parseFloat(item.mrp || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-xs">₹{parseFloat(item.purchaseRate || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-right text-xs">₹{parseFloat(item.sellingPrice || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-center text-xs font-medium">{item.quantity}</td>
                            <td className="px-3 py-2 text-xs text-gray-600">{item.expiryDate || '-'}</td>
                            <td className="px-3 py-2 text-right text-xs font-medium">
                              ₹{(parseFloat(item.purchaseRate || 0) * parseInt(item.quantity || 0)).toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => editTableItem(index)}
                                  className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => duplicateTableItem(index)}
                                  className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                                  title="Duplicate"
                                >
                                  <DocumentDuplicateIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeFromTable(index)}
                                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                  title="Remove"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="5" className="px-4 py-3 text-right font-medium text-gray-900">
                            Total Value:
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            ₹{getTotalValue().toFixed(2)}
                          </td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Save Actions */}
      {stockTable.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ready to Save</h3>
              <p className="text-sm text-gray-600">
                {stockTable.length} items • Total value: ₹{getTotalValue().toFixed(2)}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Save Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="bulkSaveMode"
                    value="save"
                    checked={bulkSaveMode === 'save'}
                    onChange={(e) => setBulkSaveMode(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    bulkSaveMode === 'save'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}>
                    Save Only
                  </div>
                </label>
                
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="bulkSaveMode"
                    value="print"
                    checked={bulkSaveMode === 'print'}
                    onChange={(e) => setBulkSaveMode(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    bulkSaveMode === 'print'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}>
                    Save & Print
                  </div>
                </label>
              </div>

              {/* Save Button */}
              <button
                onClick={handleBulkSave}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-8 rounded-lg hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 transition-all font-medium flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="w-5 h-5" />
                    Save All Items
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkStockEntryForm;