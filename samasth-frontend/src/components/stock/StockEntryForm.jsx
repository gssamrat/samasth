import React, { useState, useEffect, useRef } from 'react';
import { /* MagnifyingGlassIcon, */ CheckIcon, ArrowRightIcon, PrinterIcon, BookmarkIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { entityAPI, stockAPI } from '../../services/api';
const StockEntryForm = ({ onStockAdded }) => {
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
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const fieldRefs = useRef([]);
  const searchTimeoutRef = useRef(null);

  // Clean up search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Focus management for smooth flow
  useEffect(() => {
    if (currentStep > 0 && fieldRefs.current[currentStep - 1]) {
      fieldRefs.current[currentStep - 1].focus();
    }
  }, [currentStep]);
  
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
        // Check if it's the nested structure with resultType and results
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
        // Check if it's a product by entity type ID or type
        const isProduct = entity.et_id === '1' || entity.et_id === 1 || entity.e_type === 'product' || entity.type === 'product';
        console.log('✅ Is product?', isProduct, 'et_id:', entity.et_id, 'name:', entity.e_name);
        return isProduct;
      });
      
      console.log('🎯 Filtered products:', products.length, products);
      
      // Limit results to 10 for better UX
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

  // Define form steps
  const steps = [
    { name: 'barcode', label: 'Barcode', type: 'text', placeholder: 'Enter barcode (optional)' },
    { name: 'systemBarcode', label: 'System Barcode', type: 'text', placeholder: 'Enter system barcode (optional)' },
    { name: 'manufacturerId', label: 'Manufacturer ID', type: 'text', placeholder: 'Enter manufacturer ID (optional)' },
    { name: 'supplierId', label: 'Supplier ID', type: 'text', placeholder: 'Enter supplier ID (optional)' },
    { name: 'batchNumber', label: 'Batch Number', type: 'text', placeholder: 'Enter batch number (optional)' },
    { name: 'manufactureDate', label: 'Manufacture Date', type: 'date', placeholder: 'Select manufacture date (optional)' },
    { name: 'expiryDate', label: 'Expiry Date', type: 'date', placeholder: 'Select expiry date (optional)' },
    { name: 'mrp', label: 'MRP', type: 'number', step: '0.01', placeholder: 'Enter MRP' },
    { name: 'purchaseRate', label: 'Purchase Rate', type: 'number', step: '0.01', placeholder: 'Enter purchase rate' },
    { name: 'sellingPrice', label: 'Selling Price', type: 'number', step: '0.01', placeholder: 'Enter selling price' },
    { name: 'quantity', label: 'Quantity', type: 'number', placeholder: 'Enter quantity' }
  ];

  const handleSearchInputChange = (value) => {
    setSearchTerm(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // If input is cleared, reset selection
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
    
    // Debounced search after 300ms
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
    // Don't auto-advance to step 1, let user click Continue button
  };
  
  const handleKeyDown = (e) => {
    if (!showDropdown || searchResults.length === 0) {
      // Handle Enter to proceed to next step when product is selected
      if (e.key === 'Enter' && formData.productId && formData.productName) {
        e.preventDefault();
        setCurrentStep(1);
      }
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

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleKeyPress = (e, fieldIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentValue = formData[steps[fieldIndex].name];
      if (!currentValue) {
        toast.error('Please enter a value before continuing');
        return;
      }
      
      if (fieldIndex < steps.length - 1) {
        setCurrentStep(fieldIndex + 2); // +2 because step 0 is product selection
      } else {
        // Last field, go to save screen
        setCurrentStep(steps.length + 1);
        setTimeout(() => {
          document.getElementById('save-button')?.focus();
        }, 100);
      }
    }
  };

  const isStepComplete = (stepIndex) => {
    if (stepIndex === 0) return formData.productId; // Product selection
    const step = steps[stepIndex - 1];
    return formData[step.name] && formData[step.name].toString().trim() !== '';
  };

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'pending';
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
      
      // Reset form
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
    setCurrentStep(0);
    setSearchResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="p-1 bg-blue-600 rounded-lg">
              <BookmarkIcon className="w-4 h-4 text-white" />
            </div>
            Quick Stock Entry
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Fast, keyboard-friendly stock entry workflow
          </p>
        </div>
        
        {/* Progress Steps */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between overflow-x-auto gap-2">
            {/* Product Selection Step */}
            <div className={`flex items-center gap-1 flex-shrink-0 ${
              getStepStatus(0) === 'completed' ? 'text-green-600' :
              getStepStatus(0) === 'current' ? 'text-blue-600' : 'text-gray-400'
            }`}>
              {getStepStatus(0) === 'completed' ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                  getStepStatus(0) === 'current' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                }`}>
                  1
                </div>
              )}
              <span className="text-xs font-medium hidden sm:inline">Product</span>
            </div>
            
            {steps.map((step, index) => (
              <div key={step.name} className={`flex items-center gap-1 flex-shrink-0 ${
                getStepStatus(index + 1) === 'completed' ? 'text-green-600' :
                getStepStatus(index + 1) === 'current' ? 'text-blue-600' : 'text-gray-400'
              }`}>
                {getStepStatus(index + 1) === 'completed' ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    getStepStatus(index + 1) === 'current' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                  }`}>
                    {index + 2}
                  </div>
                )}
                <span className="text-xs font-medium hidden sm:inline">{step.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8">
          {/* Step 0: Product Selection */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Product</h3>
                <p className="text-gray-600 mb-2">Search and select the product for stock entry</p>
                <div className="flex justify-center items-center gap-2 text-sm text-blue-600">
                  <div className="flex items-center gap-1">
                    <span>💡</span>
                    <span>Type at least 2 characters to search • Use ↑↓ arrows to navigate</span>
                  </div>
                </div>
              </div>
              
              <div className="relative search-container">
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type product name or code (min 2 characters)..."
                    className="w-full px-4 py-4 pl-16 pr-12 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    autoFocus
                    autoComplete="off"
                  />
                  {/* <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" /> */}
                  
                  {/* Status indicators */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {searchLoading && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    )}
                    {!searchLoading && formData.productId && (
                      <CheckIcon className="w-5 h-5 text-green-500" />
                    )}
                    {!searchLoading && !formData.productId && searchTerm.length >= 2 && searchResults.length === 0 && (
                      <XMarkIcon className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>

                {/* Auto-fill Dropdown Results */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
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
                                ? 'bg-blue-50 border-blue-100' 
                                : 'hover:bg-gray-50 focus:bg-blue-50'
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
                                <CheckIcon className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Keyboard navigation hint */}
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                      Use ↑↓ arrow keys to navigate, Enter to select, Esc to close
                    </div>
                  </div>
                )}
                
                {/* No results message */}
                {showDropdown && searchResults.length === 0 && !searchLoading && searchTerm.length >= 2 && (
                  <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl">
                    <div className="px-4 py-6 text-center text-gray-500">
                      <div className="text-lg mb-1">No products found</div>
                      <div className="text-sm">Try a different search term</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Product Display */}
              {formData.productName && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckIcon className="w-6 h-6 text-green-600" />
                      <div>
                        <span className="font-semibold text-green-900">{formData.productName}</span>
                        <span className="text-sm text-green-700 ml-2">({formData.productCode})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors flex items-center gap-2 font-medium"
                    >
                      Continue <ArrowRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sequential Steps */}
          {currentStep > 0 && currentStep <= steps.length && (
            <div className="space-y-6">
              {/* Selected Product Header */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <CheckIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <span className="font-medium text-gray-900">{formData.productName}</span>
                    <span className="text-sm text-gray-600 ml-2">({formData.productCode})</span>
                  </div>
                </div>
              </div>

              {/* Current Step */}
              {(() => {
                const step = steps[currentStep - 1];
                const stepNumber = currentStep;
                const isLast = currentStep === steps.length;
                
                return (
                  <div className="text-center space-y-6">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">
                        {step.label}
                      </h3>
                      <p className="text-gray-600">
                        Step {stepNumber} of {steps.length} • Press Enter to continue
                      </p>
                    </div>
                    
                    <div className="max-w-md mx-auto">
                      <input
                        ref={(el) => fieldRefs.current[currentStep - 1] = el}
                        type={step.type}
                        value={formData[step.name]}
                        onChange={(e) => handleFieldChange(step.name, e.target.value)}
                        onKeyPress={(e) => handleKeyPress(e, currentStep - 1)}
                        placeholder={step.placeholder}
                        min={step.type === 'number' ? '0' : undefined}
                        step={step.step}
                        className="w-full px-6 py-4 text-xl text-center border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                      
                      <div className="mt-4 flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(currentStep - 1)}
                          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                        >
                          ← Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (formData[step.name]) {
                              if (isLast) {
                                setCurrentStep(steps.length + 1);
                              } else {
                                setCurrentStep(currentStep + 1);
                              }
                            }
                          }}
                          disabled={!formData[step.name]}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {isLast ? 'Continue' : 'Next'} <ArrowRightIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Action Buttons */}
          {currentStep > steps.length && (
            <div className="text-center space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Ready to Save!</h3>
                <p className="text-gray-600">Review your entries and save the stock entry</p>
              </div>
              
              <div className="max-w-2xl mx-auto space-y-4">
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-4 text-left">
                  <div className="font-semibold text-lg text-gray-900 border-b border-gray-200 pb-2">
                    {formData.productName}
                  </div>
                  
                  {/* Essential Fields */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="font-medium text-gray-700">Pricing & Quantity</div>
                      <div className="space-y-1 text-gray-600">
                        <div>MRP: ₹{formData.mrp}</div>
                        <div>Purchase: ₹{formData.purchaseRate}</div>
                        <div>Selling: ₹{formData.sellingPrice}</div>
                        <div className="font-medium">Quantity: {formData.quantity}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="font-medium text-gray-700">Additional Details</div>
                      <div className="space-y-1 text-gray-600">
                        {formData.barcode && <div>Barcode: {formData.barcode}</div>}
                        {formData.systemBarcode && <div>System: {formData.systemBarcode}</div>}
                        {formData.batchNumber && <div>Batch: {formData.batchNumber}</div>}
                        {formData.manufacturerId && <div>Manufacturer: {formData.manufacturerId}</div>}
                        {formData.supplierId && <div>Supplier: {formData.supplierId}</div>}
                        {formData.manufactureDate && <div>Mfg Date: {formData.manufactureDate}</div>}
                        {formData.expiryDate && <div>Expiry: {formData.expiryDate}</div>}
                        {(!formData.barcode && !formData.systemBarcode && !formData.batchNumber && 
                          !formData.manufacturerId && !formData.supplierId && !formData.manufactureDate && 
                          !formData.expiryDate) && <div className="text-gray-400 italic">No additional details</div>}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 max-w-md mx-auto">
                  <button
                    id="save-button"
                    onClick={() => handleSave(true)}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <PrinterIcon className="w-4 h-4" />
                        Save & Print
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleSave(false)}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <BookmarkIcon className="w-4 h-4" />
                    Save Only
                  </button>
                  
                  <button
                    onClick={resetForm}
                    disabled={loading}
                    className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockEntryForm;
