import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { entityTypesAPI, unitAPI } from '../services/api';
import AddUnitModal from './AddUnitModal';

const AddEntityTypeModal = ({ isOpen, onClose, onEntityTypeCreated }) => {
  const [formData, setFormData] = useState({
    et_name: '',
    et_description: '',
    parent_id: null,
    et_unit_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [entityTypes, setEntityTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [isParent, setIsParent] = useState(true);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }

  // Fetch entity types and units on component mount
  useEffect(() => {
    if (isOpen) {
      fetchEntityTypes();
      fetchUnits();
    }
  }, [isOpen]);

  const fetchEntityTypes = async () => {
    try {
      const response = await entityTypesAPI.getAll();
      // Handle different possible API response structures
      let entityTypesArray = [];
      
      if (Array.isArray(response)) {
        entityTypesArray = response;
      } else if (response && Array.isArray(response.entity_types)) {
        entityTypesArray = response.entity_types;
      } else if (response && Array.isArray(response.data)) {
        entityTypesArray = response.data;
      }
      
      setEntityTypes(entityTypesArray);
    } catch (error) {
      console.error('Error fetching entity types:', error);
      toast.error('Failed to fetch entity types');
      setEntityTypes([]); // Ensure it's always an array
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await unitAPI.getAll();
      console.log('Units API response:', response);
      
      // Handle different possible API response structures
      let unitsArray = [];
      
      if (Array.isArray(response)) {
        unitsArray = response;
      } else if (response && Array.isArray(response.units)) {
        unitsArray = response.units;
      } else if (response && Array.isArray(response.data)) {
        unitsArray = response.data;
      }
      
      console.log('Processed units array:', unitsArray);
      setUnits(unitsArray);
    } catch (error) {
      console.error('Error fetching units:', error);
      toast.error('Failed to fetch units');
      setUnits([]); // Ensure it's always an array
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleParentTypeChange = (value) => {
    setIsParent(value === 'parent');
    setFormData(prev => ({
      ...prev,
      parent_id: value === 'parent' ? null : prev.parent_id
    }));
  };

  const handleParentSelect = (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      parent_id: value === '' ? null : value
    }));
  };

  const validateForm = () => {
    if (!formData.et_name.trim()) {
      toast.error('Entity type name is required');
      return false;
    }

    if (!isParent && !formData.parent_id) {
      toast.error('Please select a parent entity type');
      return false;
    }

    if (!formData.et_unit_id) {
      toast.error('Please select a unit or create a new one');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        et_name: formData.et_name.trim(),
        et_description: formData.et_description.trim() || '',
        parent_id: isParent ? null : formData.parent_id,
        et_unit_id: formData.et_unit_id
      };

      console.log('Creating entity type with data:', requestData);
      setStatus({ type: 'info', message: 'Creating entity type...' });
      
      const result = await entityTypesAPI.create(requestData);
      console.log('Entity type creation result:', result);
      
      setStatus({ type: 'success', message: 'Entity type created successfully!' });
      toast.success('Entity type created successfully!');
      
      // Notify parent component
      if (onEntityTypeCreated && typeof onEntityTypeCreated === 'function') {
        onEntityTypeCreated(result);
      }
      
      // Reset form and close modal
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('Error creating entity type:', error);
      
      // Extract error message
      let errorMessage = 'Failed to create entity type';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setStatus({ type: 'error', message: errorMessage });
      toast.error(errorMessage);
      // Don't close modal on error, let user fix the issue
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      et_name: '',
      et_description: '',
      parent_id: null,
      et_unit_id: ''
    });
    setIsParent(true);
    setStatus(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleUnitCreated = (newUnit) => {
    // Add the new unit to the units list and select it
    if (newUnit && (newUnit.ut_id || newUnit.unit_id || newUnit.id)) {
      setUnits(prev => Array.isArray(prev) ? [...prev, newUnit] : [newUnit]);
      setFormData(prev => ({
        ...prev,
        et_unit_id: newUnit.ut_id || newUnit.unit_id || newUnit.id
      }));
      setShowAddUnit(false);
      toast.success('Unit created and selected!');
    } else {
      console.error('Invalid unit created:', newUnit);
      toast.error('Error: Invalid unit data received');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center modal-backdrop p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in modal-content">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <span className="text-2xl">📋</span>
                  Add New Entity Type
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Create a new entity type for your system
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
            {/* Entity Type Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type Name *
              </label>
              <input
                type="text"
                name="et_name"
                value={formData.et_name}
                onChange={handleInputChange}
                placeholder="e.g., Electronics, Clothing, Services"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
                disabled={loading}
              />
            </div>

            {/* Entity Type Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="et_description"
                value={formData.et_description}
                onChange={handleInputChange}
                placeholder="Brief description of this entity type..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                disabled={loading}
              />
            </div>

            {/* Parent or Child Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Entity Type Hierarchy *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleParentTypeChange('parent')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    isParent
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏛️</div>
                    <div className="font-medium">Parent Type</div>
                    <div className="text-xs mt-1 opacity-75">Top-level category</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleParentTypeChange('child')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    !isParent
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔗</div>
                    <div className="font-medium">Child Type</div>
                    <div className="text-xs mt-1 opacity-75">Sub-category</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Parent Entity Type Selection (only if child) */}
            {!isParent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Parent Entity Type *
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={handleParentSelect}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required={!isParent}
                  disabled={loading}
                >
                  <option value="">Choose parent entity type...</option>
                  {Array.isArray(entityTypes) && entityTypes.map((entityType) => (
                    <option key={entityType.et_id || entityType.id} value={entityType.et_id || entityType.id}>
                      {entityType.et_name || entityType.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Unit Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <div className="flex gap-3">
                <select
                  name="et_unit_id"
                  value={formData.et_unit_id}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                  disabled={loading}
                >
                  <option value="">Select unit...</option>
                  {Array.isArray(units) && units.map((unit) => {
                    const unitName = unit.ut_name || unit.unit_name;
                    const unitSymbol = unit.ut_symbol || unit.unit_symbol;
                    const displayText = unitSymbol ? `${unitName} (${unitSymbol})` : unitName;
                    
                    return (
                      <option key={unit.ut_id || unit.unit_id || unit.id} value={unit.ut_id || unit.unit_id || unit.id}>
                        {displayText}
                      </option>
                    );
                  })}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddUnit(true)}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors flex items-center gap-2"
                  disabled={loading}
                >
                  <span className="text-sm">➕</span>
                  Add Unit
                </button>
              </div>
            </div>

            {/* Status Message */}
            {status && (
              <div className={`p-3 rounded-lg border ${
                status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
                status.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
                'bg-blue-50 border-blue-200 text-blue-700'
              }`}>
                <div className="flex items-center gap-2">
                  <span>
                    {status.type === 'success' ? '✅' :
                     status.type === 'error' ? '❌' : 'ℹ️'}
                  </span>
                  <span className="text-sm font-medium">{status.message}</span>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Create Entity Type
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add Unit Modal */}
      <AddUnitModal
        isOpen={showAddUnit}
        onClose={() => setShowAddUnit(false)}
        onUnitCreated={handleUnitCreated}
      />
    </>
  );
};

export default AddEntityTypeModal;