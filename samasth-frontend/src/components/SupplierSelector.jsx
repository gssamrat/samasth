import React, { useState, useEffect, useRef } from 'react';
import { /* MagnifyingGlassIcon, */ CheckIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { suppliersAPI } from '../services/api';

const SupplierSelector = ({ value, onChange, error, placeholder = "Search for a supplier..." }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!initialLoaded) {
      loadInitialSuppliers();
    }
  }, [initialLoaded]);

  useEffect(() => {
    if (value && suppliers.length > 0) {
      findSelectedSupplier(value);
    }
  }, [value, suppliers]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadInitialSuppliers = async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getAll({ limit: 20, status: 'active' });
      setSuppliers(response.suppliers || response || []);
      setInitialLoaded(true);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const searchSuppliers = async (query) => {
    if (!query.trim()) {
      loadInitialSuppliers();
      return;
    }

    try {
      setLoading(true);
      const response = await suppliersAPI.search(query);
      setSuppliers(response.suppliers || response || []);
    } catch (error) {
      console.error('Failed to search suppliers:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const findSelectedSupplier = (supplierId) => {
    const supplier = suppliers.find(s => s.s_id === supplierId || s.id === supplierId);
    if (supplier) {
      setSelectedSupplier(supplier);
      setSearchQuery(supplier.s_name || supplier.name);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    clearTimeout(window.supplierSearchTimeout);
    window.supplierSearchTimeout = setTimeout(() => {
      searchSuppliers(query);
    }, 300);
  };

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    setSearchQuery(supplier.s_name || supplier.name);
    setIsOpen(false);
    onChange(supplier.s_id || supplier.id, supplier);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (!initialLoaded) {
      loadInitialSuppliers();
    }
  };

  const handleClearSelection = () => {
    setSelectedSupplier(null);
    setSearchQuery('');
    onChange(null, null);
    searchInputRef.current?.focus();
  };

  const getSupplierStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      case 'blocked':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input */}
      <div className={`relative ${error ? 'mb-1' : ''}`}>
        <div className={`flex items-center border rounded-lg bg-white ${error ? 'border-red-300' : 'border-gray-300 focus-within:border-blue-500'}`}>
          <div className="pl-3">
            {/* <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" /> */}
          </div>
          
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="flex-1 py-3 px-3 border-0 rounded-lg focus:outline-none focus:ring-0"
          />
          
          {selectedSupplier && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="pr-3 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Selected Supplier Indicator */}
        {selectedSupplier && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <CheckIcon className="w-4 h-4 text-green-600" />
            <span className="text-green-700 font-medium">
              {selectedSupplier.s_name || selectedSupplier.name} selected
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSupplierStatusColor(selectedSupplier.s_status || selectedSupplier.status)}`}>
              {selectedSupplier.s_status || selectedSupplier.status}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <span className="text-sm text-gray-500">Searching suppliers...</span>
            </div>
          ) : suppliers.length > 0 ? (
            <div className="py-1">
              {suppliers.map((supplier) => (
                <button
                  key={supplier.id}
                  type="button"
                  onClick={() => handleSupplierSelect(supplier)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                    (selectedSupplier?.s_id || selectedSupplier?.id) === (supplier.s_id || supplier.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {supplier.s_name || supplier.name}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSupplierStatusColor(supplier.s_status || supplier.status)}`}>
                            {supplier.s_status || supplier.status}
                          </span>
                        </div>
                        
                        {(supplier.s_contact_person || supplier.contact_person) && (
                          <div className="text-sm text-gray-500 truncate">
                            Contact: {supplier.s_contact_person || supplier.contact_person}
                          </div>
                        )}
                        
                        {((supplier.s_email || supplier.email) || (supplier.s_phone || supplier.phone)) && (
                          <div className="text-xs text-gray-500 truncate">
                            {(supplier.s_email || supplier.email) && (supplier.s_email || supplier.email)}
                            {(supplier.s_email || supplier.email) && (supplier.s_phone || supplier.phone) && ' • '}
                            {(supplier.s_phone || supplier.phone) && (supplier.s_phone || supplier.phone)}
                          </div>
                        )}
                      </div>
                    
                    {(selectedSupplier?.s_id || selectedSupplier?.id) === (supplier.s_id || supplier.id) && (
                      <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500">
              {searchQuery.trim() ? (
                <div>
                  <BuildingOfficeIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No suppliers found for "{searchQuery}"</p>
                </div>
              ) : (
                <div>
                  <BuildingOfficeIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No suppliers available</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SupplierSelector;
