import React, { useState, useEffect, useRef } from 'react';
import { /* MagnifyingGlassIcon, */ CheckIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { partnersAPI } from '../services/api';

const ManufacturerSelector = ({ value, onChange, error, placeholder = "Search for a manufacturer..." }) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!initialLoaded) {
      loadInitialManufacturers();
    }
  }, [initialLoaded]);

  useEffect(() => {
    if (value && manufacturers.length > 0) {
      findSelectedManufacturer(value);
    }
  }, [value, manufacturers]);

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

  const loadInitialManufacturers = async () => {
    try {
      setLoading(true);
      const response = await partnersAPI.getByType('manufacturer', { limit: 20, status: 'active' });
      setManufacturers(response.suppliers || response || []);
      setInitialLoaded(true);
    } catch (error) {
      console.error('Failed to load manufacturers:', error);
      setManufacturers([]);
    } finally {
      setLoading(false);
    }
  };

  const searchManufacturers = async (query) => {
    if (!query.trim()) {
      loadInitialManufacturers();
      return;
    }

    try {
      setLoading(true);
      const response = await partnersAPI.search(query);
      // Filter to only manufacturers
      const allResults = response.suppliers || response || [];
      setManufacturers(allResults.filter(item => (item.s_type || item.business_type) === 'manufacturer'));
    } catch (error) {
      console.error('Failed to search manufacturers:', error);
      setManufacturers([]);
    } finally {
      setLoading(false);
    }
  };

  const findSelectedManufacturer = (manufacturerId) => {
    const manufacturer = manufacturers.find(m => (m.s_id || m.id) === manufacturerId);
    if (manufacturer) {
      setSelectedManufacturer(manufacturer);
      setSearchQuery(manufacturer.s_name || manufacturer.name);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    clearTimeout(window.manufacturerSearchTimeout);
    window.manufacturerSearchTimeout = setTimeout(() => {
      searchManufacturers(query);
    }, 300);
  };

  const handleManufacturerSelect = (manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setSearchQuery(manufacturer.s_name || manufacturer.name);
    setIsOpen(false);
    onChange(manufacturer.s_id || manufacturer.id, manufacturer);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (!initialLoaded) {
      loadInitialManufacturers();
    }
  };

  const handleClearSelection = () => {
    setSelectedManufacturer(null);
    setSearchQuery('');
    onChange(null, null);
    searchInputRef.current?.focus();
  };

  const getManufacturerStatusColor = (status) => {
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
          
          {selectedManufacturer && (
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
        
        {/* Selected Manufacturer Indicator */}
        {selectedManufacturer && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <CheckIcon className="w-4 h-4 text-green-600" />
            <span className="text-green-700 font-medium">
              {selectedManufacturer.s_name || selectedManufacturer.name} selected
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getManufacturerStatusColor(selectedManufacturer.s_status || selectedManufacturer.status)}`}>
              {selectedManufacturer.s_status || selectedManufacturer.status}
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
              <span className="text-sm text-gray-500">Searching manufacturers...</span>
            </div>
          ) : manufacturers.length > 0 ? (
            <div className="py-1">
              {manufacturers.map((manufacturer) => (
                <button
                  key={manufacturer.id}
                  type="button"
                  onClick={() => handleManufacturerSelect(manufacturer)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                    (selectedManufacturer?.s_id || selectedManufacturer?.id) === (manufacturer.s_id || manufacturer.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BuildingOffice2Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {manufacturer.s_name || manufacturer.name}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getManufacturerStatusColor(manufacturer.s_status || manufacturer.status)}`}>
                          {manufacturer.s_status || manufacturer.status}
                        </span>
                      </div>
                      
                      {(manufacturer.s_contact_person || manufacturer.contact_person) && (
                        <div className="text-sm text-gray-500 truncate">
                          Contact: {manufacturer.s_contact_person || manufacturer.contact_person}
                        </div>
                      )}
                      
                      {((manufacturer.s_email || manufacturer.email) || (manufacturer.s_phone || manufacturer.phone)) && (
                        <div className="text-xs text-gray-500 truncate">
                          {(manufacturer.s_email || manufacturer.email) && (manufacturer.s_email || manufacturer.email)}
                          {(manufacturer.s_email || manufacturer.email) && (manufacturer.s_phone || manufacturer.phone) && ' • '}
                          {(manufacturer.s_phone || manufacturer.phone) && (manufacturer.s_phone || manufacturer.phone)}
                        </div>
                      )}
                      
                      {(manufacturer.s_address || manufacturer.address) && (
                        <div className="text-xs text-gray-500 truncate">
                          📍 {(manufacturer.s_address || manufacturer.address).substring(0, 50)}...
                        </div>
                      )}
                    </div>
                    
                    {(selectedManufacturer?.s_id || selectedManufacturer?.id) === (manufacturer.s_id || manufacturer.id) && (
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
                  <BuildingOffice2Icon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No manufacturers found for "{searchQuery}"</p>
                </div>
              ) : (
                <div>
                  <BuildingOffice2Icon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">No manufacturers available</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManufacturerSelector;
