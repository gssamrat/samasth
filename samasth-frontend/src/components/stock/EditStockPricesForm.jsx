import React, { useState, useEffect, useRef } from 'react';
import { 
  MagnifyingGlassIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  ExclamationTriangleIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { entityAPI, stockAPI } from '../../services/api';

const EditStockPricesForm = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef(null);

  // Stock records for selected entity
  const [stockRecords, setStockRecords] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Editing states
  const [editingRows, setEditingRows] = useState(new Set());
  const [editedData, setEditedData] = useState({});
  const [saving, setSaving] = useState(false);

  // Related entities handling
  const [relatedEntities, setRelatedEntities] = useState([]);
  const [showRelatedModal, setShowRelatedModal] = useState(false);
  const [pendingEdit, setPendingEdit] = useState(null);

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
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchEntities(value);
    }, 300);
  };

  const selectEntity = async (entity) => {
    setSelectedEntity(entity);
    setSearchTerm(entity.e_name || entity.name);
    setShowDropdown(false);
    setSelectedIndex(-1);
    
    await loadStockRecords(entity.e_id || entity.id);
  };

  const loadStockRecords = async (entityId) => {
    setLoadingStock(true);
    try {
      const stockData = await stockAPI.getStockByProduct(entityId);
      setStockRecords(Array.isArray(stockData) ? stockData : []);
    } catch (error) {
      console.error('Error loading stock records:', error);
      toast.error('Failed to load stock records');
      setStockRecords([]);
    } finally {
      setLoadingStock(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || searchResults.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => prev < searchResults.length - 1 ? prev + 1 : 0);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : searchResults.length - 1);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          selectEntity(searchResults[selectedIndex]);
        }
        break;
        
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const startEditing = (stockId) => {
    setEditingRows(prev => new Set([...prev, stockId]));
    
    // Initialize edited data with current values
    const record = stockRecords.find(r => r.s_id === stockId);
    if (record) {
      setEditedData(prev => ({
        ...prev,
        [stockId]: {
          s_mrp: record.s_mrp || '',
          s_purchase_value: record.s_purchase_value || '',
          s_sale_value: record.s_sale_value || '',
          s_expirydt: record.s_expirydt ? new Date(record.s_expirydt).toISOString().split('T')[0] : '',
          s_batchno: record.s_batchno || '',
          s_manfacture_dt: record.s_manfacture_dt ? new Date(record.s_manfacture_dt).toISOString().split('T')[0] : ''
        }
      }));
    }
  };

  const cancelEditing = (stockId) => {
    setEditingRows(prev => {
      const newSet = new Set(prev);
      newSet.delete(stockId);
      return newSet;
    });
    
    setEditedData(prev => {
      const newData = { ...prev };
      delete newData[stockId];
      return newData;
    });
  };

  const handleFieldChange = (stockId, field, value) => {
    setEditedData(prev => ({
      ...prev,
      [stockId]: {
        ...prev[stockId],
        [field]: value
      }
    }));
  };

  const checkRelatedEntities = async (entityId) => {
    try {
      // Get all entities related to this entity
      const allEntities = await entityAPI.getAllEntities();
      const related = allEntities.filter(entity => 
        entity.e_related_to_e === entityId || entity.e_related_to_e === entityId.toString()
      );
      return related;
    } catch (error) {
      console.error('Error checking related entities:', error);
      return [];
    }
  };

  const saveChanges = async (stockId) => {
    const changes = editedData[stockId];
    if (!changes) return;

    // Check for related entities before saving
    const related = await checkRelatedEntities(selectedEntity.e_id || selectedEntity.id);
    
    if (related.length > 0) {
      setRelatedEntities(related);
      setPendingEdit({ stockId, changes });
      setShowRelatedModal(true);
      return;
    }

    await performSave(stockId, changes, false);
  };

  const performSave = async (stockId, changes, includeRelated) => {
    setSaving(true);
    try {
      await stockAPI.update(stockId, changes);
      
      // Update local state
      setStockRecords(prev => prev.map(record => 
        record.s_id === stockId ? { ...record, ...changes } : record
      ));

      // If user chose to update related entities
      if (includeRelated && relatedEntities.length > 0) {
        for (const relatedEntity of relatedEntities) {
          const relatedStock = await stockAPI.getStockByProduct(relatedEntity.e_id);
          if (relatedStock && relatedStock.length > 0) {
            for (const stock of relatedStock) {
              await stockAPI.update(stock.s_id, changes);
            }
          }
        }
        toast.success(`Updated stock and ${relatedEntities.length} related entities`);
      } else {
        toast.success('Stock updated successfully');
      }

      // Clean up editing state
      setEditingRows(prev => {
        const newSet = new Set(prev);
        newSet.delete(stockId);
        return newSet;
      });
      
      setEditedData(prev => {
        const newData = { ...prev };
        delete newData[stockId];
        return newData;
      });

    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
      setShowRelatedModal(false);
      setPendingEdit(null);
      setRelatedEntities([]);
    }
  };

  const handleRelatedEntitiesDecision = (includeRelated) => {
    if (pendingEdit) {
      performSave(pendingEdit.stockId, pendingEdit.changes, includeRelated);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <PencilIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Edit Stock Prices</h2>
              <p className="text-indigo-100 mt-0.5 text-sm">
                Search for products and edit their stock information
              </p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="p-6">
          <div className="relative search-container mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for entity/product to edit..."
                className="w-full px-4 py-3 pr-12 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                autoComplete="off"
              />
              
              {searchLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                </div>
              )}
            </div>

            {/* Search Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                <div className="py-1">
                  {searchResults.map((entity, index) => {
                    const isHighlighted = index === selectedIndex;
                    return (
                      <button
                        key={entity.e_id || entity.id || index}
                        type="button"
                        onClick={() => selectEntity(entity)}
                        className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-50 last:border-b-0 ${
                          isHighlighted 
                            ? 'bg-indigo-50 border-indigo-100' 
                            : 'hover:bg-gray-50 focus:bg-indigo-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 truncate">
                              {entity.e_name || entity.name || 'Unnamed Product'}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              ID: {entity.e_id || entity.id} • Code: {entity.e_code || entity.code || entity.e_barcode || 'N/A'}
                            </div>
                          </div>
                          {isHighlighted && (
                            <CheckIcon className="w-5 h-5 text-indigo-500 flex-shrink-0 ml-2" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selected Entity Info */}
          {selectedEntity && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <CheckIcon className="w-6 h-6 text-indigo-600" />
                <div>
                  <span className="font-semibold text-indigo-900">{selectedEntity.e_name || selectedEntity.name}</span>
                  <span className="text-sm text-indigo-700 ml-2">
                    ID: {selectedEntity.e_id || selectedEntity.id}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stock Records Table */}
      {selectedEntity && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-1 bg-indigo-500 rounded">
                <PencilIcon className="w-4 h-4 text-white" />
              </div>
              Stock Records for {selectedEntity.e_name || selectedEntity.name}
            </h3>
          </div>

          <div className="p-6">
            {loadingStock ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-gray-600">Loading stock records...</span>
              </div>
            ) : stockRecords.length === 0 ? (
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No stock records found for this entity</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Stock ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Entity Name</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Purchase Rate</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">MRP</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Selling Price</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Expiry Date</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Batch No</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Manufacture Date</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockRecords.map((record) => {
                      const isEditing = editingRows.has(record.s_id);
                      const editData = editedData[record.s_id] || {};
                      
                      return (
                        <tr key={record.s_id} className={isEditing ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.s_id}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {selectedEntity.e_name || selectedEntity.name}
                          </td>
                          
                          {/* Purchase Rate */}
                          <td className="px-4 py-3 text-sm text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editData.s_purchase_value}
                                onChange={(e) => handleFieldChange(record.s_id, 's_purchase_value', e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            ) : (
                              `₹${(record.s_purchase_value || 0).toFixed(2)}`
                            )}
                          </td>
                          
                          {/* MRP */}
                          <td className="px-4 py-3 text-sm text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editData.s_mrp}
                                onChange={(e) => handleFieldChange(record.s_id, 's_mrp', e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            ) : (
                              `₹${(record.s_mrp || 0).toFixed(2)}`
                            )}
                          </td>
                          
                          {/* Selling Price */}
                          <td className="px-4 py-3 text-sm text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={editData.s_sale_value}
                                onChange={(e) => handleFieldChange(record.s_id, 's_sale_value', e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            ) : (
                              `₹${(record.s_sale_value || 0).toFixed(2)}`
                            )}
                          </td>
                          
                          {/* Expiry Date */}
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {isEditing ? (
                              <input
                                type="date"
                                value={editData.s_expirydt}
                                onChange={(e) => handleFieldChange(record.s_id, 's_expirydt', e.target.value)}
                                className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            ) : (
                              record.s_expirydt ? new Date(record.s_expirydt).toLocaleDateString() : '-'
                            )}
                          </td>
                          
                          {/* Batch No */}
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editData.s_batchno}
                                onChange={(e) => handleFieldChange(record.s_id, 's_batchno', e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            ) : (
                              record.s_batchno || '-'
                            )}
                          </td>
                          
                          {/* Manufacture Date */}
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {isEditing ? (
                              <input
                                type="date"
                                value={editData.s_manfacture_dt}
                                onChange={(e) => handleFieldChange(record.s_id, 's_manfacture_dt', e.target.value)}
                                className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            ) : (
                              record.s_manfacture_dt ? new Date(record.s_manfacture_dt).toLocaleDateString() : '-'
                            )}
                          </td>
                          
                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveChanges(record.s_id)}
                                    disabled={saving}
                                    className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
                                    title="Save changes"
                                  >
                                    <CheckIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => cancelEditing(record.s_id)}
                                    disabled={saving}
                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded disabled:opacity-50"
                                    title="Cancel editing"
                                  >
                                    <XMarkIcon className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => startEditing(record.s_id)}
                                  className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
                                  title="Edit record"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related Entities Modal */}
      {showRelatedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <LinkIcon className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-semibold">Related Entities Found</h3>
                  <p className="text-orange-100 text-sm">This entity has related products</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-3">
                  Found <strong>{relatedEntities.length}</strong> related entities:
                </p>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {relatedEntities.map((entity, index) => (
                    <div key={entity.e_id} className="text-sm text-gray-600 py-1">
                      • {entity.e_name} (ID: {entity.e_id})
                    </div>
                  ))}
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Would you like to apply the same changes to all related entities as well?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleRelatedEntitiesDecision(true)}
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    'Yes, Update All'
                  )}
                </button>
                <button
                  onClick={() => handleRelatedEntitiesDecision(false)}
                  disabled={saving}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  No, Only This One
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditStockPricesForm;
