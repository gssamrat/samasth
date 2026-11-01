import React, { useState, useEffect, useRef } from 'react';
import { 
  // MagnifyingGlassIcon, 
  CheckIcon, 
  XMarkIcon,
  ArrowRightIcon,
  PrinterIcon,
  BookmarkIcon,
  SparklesIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { entityAPI, stockAPI } from '../../services/api';

const FlashStockEntryForm = ({ onStockAdded }) => {
  const [formData, setFormData] = useState({
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
    quantity: ''
  });

  // Product search states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef(null);

  // Flash modal states
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [fieldValue, setFieldValue] = useState('');
  const [loading, setLoading] = useState(false);

  // Define form steps for flash modals
  const flashSteps = [
    { 
      name: 'barcode', 
      label: 'Barcode', 
      type: 'text', 
      placeholder: 'Enter product barcode',
      icon: '�',
      description: 'Scan or enter the product barcode (optional)'
    },
    { 
      name: 'systemBarcode', 
      label: 'System Barcode', 
      type: 'text', 
      placeholder: 'Enter system generated barcode',
      icon: '🔢',
      description: 'Internal system barcode for tracking (optional)'
    },
    { 
      name: 'manufacturerId', 
      label: 'Manufacturer ID', 
      type: 'text', 
      placeholder: 'Enter manufacturer identifier',
      icon: '🏭',
      description: 'ID of the manufacturer/brand (optional)'
    },
    { 
      name: 'supplierId', 
      label: 'Supplier ID', 
      type: 'text', 
      placeholder: 'Enter supplier identifier',
      icon: '🚚',
      description: 'ID of the supplier who provided this stock (optional)'
    },
    { 
      name: 'batchNumber', 
      label: 'Batch Number', 
      type: 'text', 
      placeholder: 'Enter batch number',
      icon: '🏷️',
      description: 'Manufacturing batch number for tracking (optional)'
    },
    { 
      name: 'manufactureDate', 
      label: 'Manufacture Date', 
      type: 'date', 
      placeholder: 'Select manufacture date',
      icon: '🏭',
      description: 'When was this product manufactured? (optional)'
    },
    { 
      name: 'expiryDate', 
      label: 'Expiry Date', 
      type: 'date', 
      placeholder: 'Select expiry date',
      icon: '📅',
      description: 'When does this product expire? (optional)'
    },
    { 
      name: 'mrp', 
      label: 'MRP', 
      type: 'number', 
      step: '0.01', 
      placeholder: 'Enter Maximum Retail Price',
      icon: '💰',
      description: 'The maximum retail price for this product'
    },
    { 
      name: 'purchaseRate', 
      label: 'Purchase Rate', 
      type: 'number', 
      step: '0.01', 
      placeholder: 'Enter purchase cost',
      icon: '🛒',
      description: 'The cost at which you purchased this product'
    },
    { 
      name: 'sellingPrice', 
      label: 'Selling Price', 
      type: 'number', 
      step: '0.01', 
      placeholder: 'Enter selling price',
      icon: '🏷️',
      description: 'The price at which you will sell this product'
    },
    { 
      name: 'quantity', 
      label: 'Quantity', 
      type: 'number', 
      placeholder: 'Enter quantity to add',
      icon: '📦',
      description: 'Number of units being added to stock'
    }
  ];

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
      // Use searchEntity API with the query
      const response = await entityAPI.searchEntity(query.trim());
      console.log('🔍 Raw API Response:', response);
      
      // Handle nested response structure from searchEntity
      let entities = [];
      if (Array.isArray(response)) {
        if (response.length > 0 && response[0].resultType === 'Entity' && response[0].results) {
          entities = response[0].results;
          console.log('📦 Using nested results array:', entities);
        } else {
          // It's a flat array of entities
          entities = response;
          console.log('📦 Using flat array:', entities);
        }
      } else if (response && response.results) {
        entities = response.results;
        console.log('📦 Using response.results:', entities);
      }
      
      console.log('🏭 Total entities found:', entities.length);
      
      // Filter for products only - searchEntity already returns filtered results, but we still filter by product type
      const products = entities.filter(entity => {
        console.log('🔍 Checking entity:', {
          e_id: entity.e_id,
          e_name: entity.e_name,
          et_id: entity.et_id,
          e_type: entity.e_type
        });
        
        const isProduct = entity.et_id === '1' || entity.et_id === 1 || entity.e_type === 'product' || entity.type === 'product';
        console.log('✅ Is product?', isProduct, 'et_id:', entity.et_id);
        
        return isProduct;
      });
      
      console.log('🎯 Filtered products:', products.length, products);
      
      setSearchResults(products.slice(0, 10));
      setShowDropdown(products.length > 0);
      setSelectedIndex(-1);
      
      console.log('💡 Dropdown will show:', products.length > 0);
    } catch (error) {
      console.error('❌ Error searching entities:', error);
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
      setFormData(prev => ({
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
    setFormData(prev => ({
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
    if (!showDropdown || searchResults.length === 0) {
      return;
    }
    
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

  const startFlashForm = () => {
    if (!formData.productId) {
      toast.error('Please select a product first');
      return;
    }
    setCurrentField(0);
    setFieldValue(formData[flashSteps[0].name] || '');
    setShowFlashModal(true);
  };

  const handleFlashNext = () => {
    if (currentField !== null) {
      // Save current field value
      setFormData(prev => ({
        ...prev,
        [flashSteps[currentField].name]: fieldValue
      }));

      // Move to next field or finish
      if (currentField < flashSteps.length - 1) {
        const nextField = currentField + 1;
        setCurrentField(nextField);
        setFieldValue(formData[flashSteps[nextField].name] || '');
      } else {
        setShowFlashModal(false);
        setCurrentField(null);
      }
    }
  };

  const handleFlashBack = () => {
    if (currentField > 0) {
      // Save current field value
      setFormData(prev => ({
        ...prev,
        [flashSteps[currentField].name]: fieldValue
      }));

      const prevField = currentField - 1;
      setCurrentField(prevField);
      setFieldValue(formData[flashSteps[prevField].name] || '');
    }
  };

  const validateForm = () => {
    if (!formData.productId) {
      toast.error('Please select a product');
      return false;
    }
    if (!formData.mrp || parseFloat(formData.mrp) <= 0) {
      toast.error('Please enter a valid MRP');
      return false;
    }
    if (!formData.purchaseRate || parseFloat(formData.purchaseRate) <= 0) {
      toast.error('Please enter a valid purchase rate');
      return false;
    }
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      toast.error('Please enter a valid selling price');
      return false;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return false;
    }
    return true;
  };

  const handleSave = async (addToPrintJob = false) => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const stockData = {
        s_eid: formData.productId,
        s_barcode: formData.barcode || null,
        s_sysbarcode_1: formData.systemBarcode || null,
        s_bp_man_id: formData.manufacturerId || null,
        s_bp_sup_id: formData.supplierId || null,
        s_batchno: formData.batchNumber || null,
        s_manfacture_dt: formData.manufactureDate || null,
        s_expirydt: formData.expiryDate || null,
        s_mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        s_purchase_value: formData.purchaseRate ? parseFloat(formData.purchaseRate) : null,
        s_sale_value: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
        s_qty: formData.quantity ? parseInt(formData.quantity) : null
      };

      const result = await stockAPI.addStock(stockData);
      
      if (addToPrintJob) {
        toast.success('Stock added and added to print job!');
      } else {
        toast.success('Stock added successfully!');
      }
      
      resetForm();

      if (onStockAdded) {
        onStockAdded({ ...result, addToPrintJob });
      }
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error(error.response?.data?.message || 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
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
      quantity: ''
    });
    setSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setShowFlashModal(false);
    setCurrentField(null);
    setFieldValue('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Flash Stock Entry</h2>
              <p className="text-blue-100 mt-0.5 text-sm">
                Lightning-fast stock addition with smart flash modals
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Product Selection */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Product</h3>
              <p className="text-gray-600">Search and select the product to add stock</p>
            </div>
            
            <div className="relative search-container max-w-lg mx-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products by name or code..."
                className="w-full px-4 py-4 pl-14 pr-12 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                autoComplete="off"
              />
              {/* <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" /> */}
              
              {/* Status indicators */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                {searchLoading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
                )}
                {!searchLoading && formData.productId && (
                  <CheckIcon className="w-5 h-5 text-green-500" />
                )}
                {!searchLoading && !formData.productId && searchTerm.length >= 2 && searchResults.length === 0 && (
                  <XMarkIcon className="w-5 h-5 text-red-400" />
                )}
              </div>

              {/* Debug info */}
              {console.log('🔍 Dropdown Debug:', {
                showDropdown,
                searchResultsLength: searchResults.length,
                searchTerm,
                searchLoading
              })}
              
              {/* Dropdown results */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                  <div className="py-2">
                    {searchResults.map((product, index) => {
                      const isHighlighted = index === selectedIndex;
                      return (
                        <button
                          key={product.e_id || product.id || index}
                          type="button"
                          onClick={() => selectProduct(product)}
                          className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-b-0 ${
                            isHighlighted 
                              ? 'bg-purple-50 border-purple-100' 
                              : 'hover:bg-gray-50 focus:bg-purple-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 truncate">
                                {product.e_name || product.name || 'Unnamed Product'}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {product.e_weight && <span>Weight: {product.e_weight}kg • </span>}
                                Code: {product.e_code || product.code || product.e_barcode || 'N/A'}
                              </div>
                            </div>
                            {isHighlighted && (
                              <CheckIcon className="w-5 h-5 text-purple-500 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                    Use ↑↓ arrow keys to navigate, Enter to select, Esc to close
                  </div>
                </div>
              )}

              {/* No results */}
              {showDropdown && searchResults.length === 0 && !searchLoading && searchTerm.length >= 2 && (
                <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl">
                  <div className="px-4 py-6 text-center text-gray-500">
                    <div className="text-lg mb-1">No products found</div>
                    <div className="text-sm">Try a different search term</div>
                  </div>
                </div>
              )}
            </div>

            {/* Debug Information - Remove this in production */}
            {searchTerm && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                <div className="font-semibold text-yellow-800 mb-2">🐛 Debug Info:</div>
                <div className="space-y-1 text-yellow-700">
                  <div>Search Term: "{searchTerm}" ({searchTerm.length} chars)</div>
                  <div>Loading: {searchLoading ? 'Yes' : 'No'}</div>
                  <div>Results Count: {searchResults.length}</div>
                  <div>Show Dropdown: {showDropdown ? 'Yes' : 'No'}</div>
                  <div>Selected Product: {formData.productName || 'None'}</div>
                  {searchResults.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">View Results ({searchResults.length})</summary>
                      <pre className="mt-1 text-xs bg-yellow-100 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(searchResults.map(r => ({ 
                          id: r.e_id, 
                          name: r.e_name, 
                          et_id: r.et_id,
                          weight: r.e_weight 
                        })), null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {/* Selected Product Display */}
            {formData.productName && (
              <div className="mt-6 max-w-lg mx-auto">
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckIcon className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="font-semibold text-green-900">{formData.productName}</div>
                      <div className="text-sm text-green-700">Code: {formData.productCode || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Flash Entry Button */}
          {formData.productId && (
            <div className="text-center mb-8">
              <button
                onClick={startFlashForm}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 focus:ring-2 focus:ring-purple-500 transition-all flex items-center gap-3 mx-auto font-semibold text-lg shadow-lg"
              >
                <SparklesIcon className="w-6 h-6" />
                Start Flash Entry
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Form Summary */}
          {formData.productId && (
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CubeIcon className="w-5 h-5" />
                Entry Progress
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {flashSteps.map((step) => {
                  const value = formData[step.name];
                  const isComplete = value && value.toString().trim() !== '';
                  return (
                    <div
                      key={step.name}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isComplete 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{step.icon}</span>
                        <span className={`text-sm font-medium ${
                          isComplete ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          {step.label}
                        </span>
                        {isComplete && <CheckIcon className="w-4 h-4 text-green-500" />}
                      </div>
                      <div className={`text-sm ${
                        isComplete ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {isComplete ? value : 'Not set'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Buttons */}
              {formData.mrp && formData.purchaseRate && formData.sellingPrice && formData.quantity && (
                <div className="mt-6 flex gap-3 justify-center">
                  <button
                    onClick={() => handleSave(true)}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <PrinterIcon className="w-5 h-5" />
                        Save & Print
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleSave(false)}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <BookmarkIcon className="w-5 h-5" />
                    Save
                  </button>
                  
                  <button
                    onClick={resetForm}
                    disabled={loading}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Flash Modal */}
      {showFlashModal && currentField !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{flashSteps[currentField].icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{flashSteps[currentField].label}</h3>
                    <p className="text-purple-100 text-sm">Step {currentField + 1} of {flashSteps.length}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFlashModal(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                {flashSteps[currentField].description}
              </p>
              
              <input
                type={flashSteps[currentField].type}
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleFlashNext();
                  }
                }}
                placeholder={flashSteps[currentField].placeholder}
                min={flashSteps[currentField].type === 'number' ? '0' : undefined}
                step={flashSteps[currentField].step}
                className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-center"
                autoFocus
              />

              {/* Progress bar */}
              <div className="mt-6 mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(((currentField + 1) / flashSteps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentField + 1) / flashSteps.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3">
                {currentField > 0 && (
                  <button
                    onClick={handleFlashBack}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleFlashNext}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 focus:ring-2 focus:ring-purple-500 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  {currentField < flashSteps.length - 1 ? 'Next' : 'Finish'}
                  {currentField < flashSteps.length - 1 && <ArrowRightIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashStockEntryForm;