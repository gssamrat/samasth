import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { unitAPI } from '../services/api';

const AddUnitModal = ({ isOpen, onClose, onUnitCreated }) => {
  const [formData, setFormData] = useState({
    unit_name: '',
    unit_symbol: '',
    unit_description: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [needsChildren, setNeedsChildren] = useState('no');
  const [childInputType, setChildInputType] = useState('default'); // 'default' or 'user'
  const [childCount, setChildCount] = useState(10);
  const [childNames, setChildNames] = useState(Array(30).fill(''));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChildNameChange = (index, value) => {
    const newChildNames = [...childNames];
    newChildNames[index] = value;
    setChildNames(newChildNames);
  };

  const handleChildCountChange = (e) => {
    const count = parseInt(e.target.value) || 10;
    setChildCount(Math.min(Math.max(1, count), 30));
  };

  const validateForm = () => {
    if (!formData.unit_name.trim()) {
      toast.error('Unit name is required');
      return false;
    }

    if (!formData.unit_symbol.trim()) {
      toast.error('Unit symbol is required');
      return false;
    }

    // Validate child units if needed
    if (needsChildren === 'yes' && childInputType === 'user') {
      const filledChildren = childNames.slice(0, childCount).filter(name => name.trim());
      if (filledChildren.length === 0) {
        toast.error('Please enter at least one child unit name');
        return false;
      }
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
        ut_name: formData.unit_name.trim(),
        ut_symbol: formData.unit_symbol.trim(),
        ut_description: formData.unit_description.trim() || ''
      };

      // Add child unit data if needed
      if (needsChildren === 'yes') {
        if (childInputType === 'default') {
          // Create default children from 1 to 10
          requestData.children = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
        } else if (childInputType === 'user') {
          // Use user-entered child names (filter out empty ones)
          requestData.children = childNames
            .slice(0, childCount)
            .filter(name => name.trim())
            .map(name => name.trim());
        }
      }

      console.log('Creating unit with data:', requestData);
      setStatus({ type: 'info', message: 'Creating unit...' });
      
      const result = await unitAPI.create(requestData);
      console.log('Unit creation result:', result);
      
      setStatus({ type: 'success', message: 'Unit created successfully!' });
      toast.success('Unit created successfully!');
      
      // Notify parent component
      if (onUnitCreated && typeof onUnitCreated === 'function') {
        onUnitCreated(result);
      }
      
      // Reset form and close modal
      resetForm();
      onClose();
      
    } catch (error) {
      console.error('Error creating unit:', error);
      
      // Extract error message
      let errorMessage = 'Failed to create unit';
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
      unit_name: '',
      unit_symbol: '',
      unit_description: ''
    });
    setStatus(null);
    setNeedsChildren('no');
    setChildInputType('default');
    setChildCount(10);
    setChildNames(Array(30).fill(''));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center nested-modal-backdrop p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in nested-modal-content">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <span className="text-2xl">📏</span>
                  Add New Unit
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Create a new unit of measurement
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
            {/* Unit Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Name *
              </label>
              <input
                type="text"
                name="unit_name"
                value={formData.unit_name}
                onChange={handleInputChange}
                placeholder="e.g., Kilogram, Piece, Liter"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                required
                disabled={loading}
              />
            </div>

            {/* Unit Symbol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Symbol *
              </label>
              <input
                type="text"
                name="unit_symbol"
                value={formData.unit_symbol}
                onChange={handleInputChange}
                placeholder="e.g., kg, pcs, L"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                required
                disabled={loading}
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Short abbreviation for the unit (max 10 characters)
              </p>
            </div>

            {/* Unit Children */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit Childs needed ?
              </label>
              
              {/* Yes/No Radio Buttons */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="needsChildren"
                    value="no"
                    checked={needsChildren === 'no'}
                    onChange={(e) => setNeedsChildren(e.target.value)}
                    disabled={loading}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="needsChildren"
                    value="yes"
                    checked={needsChildren === 'yes'}
                    onChange={(e) => setNeedsChildren(e.target.value)}
                    disabled={loading}
                    className="w-4 h-4 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
              </div>

              {/* Child Input Type Selection */}
              {needsChildren === 'yes' && (
                <div className="space-y-4 pl-6 border-l-2 border-green-200">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="childInputType"
                        value="default"
                        checked={childInputType === 'default'}
                        onChange={(e) => setChildInputType(e.target.value)}
                        disabled={loading}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Create default (1 to 10)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="childInputType"
                        value="user"
                        checked={childInputType === 'user'}
                        onChange={(e) => setChildInputType(e.target.value)}
                        disabled={loading}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">User will enter</span>
                    </label>
                  </div>

                  {/* User Input for Child Names */}
                  {childInputType === 'user' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700">
                          Number of children:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={childCount}
                          onChange={handleChildCountChange}
                          disabled={loading}
                          className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <span className="text-xs text-gray-500">(max 30)</span>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-lg">
                        {Array.from({ length: childCount }, (_, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <label className="text-sm text-gray-600 w-20">
                              Child {index + 1}:
                            </label>
                            <input
                              type="text"
                              value={childNames[index]}
                              onChange={(e) => handleChildNameChange(index, e.target.value)}
                              placeholder={`Enter name for child ${index + 1}`}
                              disabled={loading}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Unit Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="unit_description"
                value={formData.unit_description}
                onChange={handleInputChange}
                placeholder="Brief description of this unit..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                disabled={loading}
              />
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

            {/* Examples */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Examples:</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>• Weight: kg, g, lb</div>
                <div>• Volume: L, ml, gal</div>
                <div>• Length: m, cm, ft</div>
                <div>• Quantity: pcs, box, set</div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Create Unit
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
    </>
  );
};

export default AddUnitModal;