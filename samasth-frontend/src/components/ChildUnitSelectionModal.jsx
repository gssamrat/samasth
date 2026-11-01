import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ChildUnitSelectionModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  entityName,
  parentUnit,
  childUnits = []
}) => {
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUnits([]);
      setSelectAll(false);
    }
  }, [isOpen]);

  // Handle individual checkbox change
  const handleUnitToggle = (unit) => {
    setSelectedUnits(prev => {
      const isSelected = prev.some(selected => selected.ut_id === unit.ut_id);
      
      if (isSelected) {
        // Remove from selection
        return prev.filter(selected => selected.ut_id !== unit.ut_id);
      } else {
        // Add to selection
        return [...prev, unit];
      }
    });
  };

  // Handle select all toggle
  const handleSelectAllToggle = () => {
    if (selectAll) {
      setSelectedUnits([]);
      setSelectAll(false);
    } else {
      setSelectedUnits([...childUnits]);
      setSelectAll(true);
    }
  };

  // Update select all state when individual items change
  useEffect(() => {
    setSelectAll(selectedUnits.length === childUnits.length && childUnits.length > 0);
  }, [selectedUnits.length, childUnits.length]);

  const handleConfirm = () => {
    if (selectedUnits.length === 0) {
      toast.error('Please select at least one unit type');
      return;
    }

    // Create entity variants based on selected units
    const entityVariants = selectedUnits.map(unit => ({
      name: `${entityName} ${unit.ut_name || unit.unit_name} ${unit.ut_symbol}`,
      originalName: entityName,
      unitId: unit.ut_id || unit.unit_id || unit.id,
      unitName: unit.ut_name || unit.unit_name,
      unitSymbol: unit.ut_symbol || unit.unit_symbol,
      unitDescription: unit.ut_description || unit.unit_description
    }));

    onConfirm(entityVariants);
  };

  const handleSkip = () => {
    onConfirm([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                <span className="text-2xl">📋</span>
                Create Entity Variants
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                The selected unit type has child units. Would you like to create entities for each child unit?
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Entity Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-1">Entity: {entityName}</h3>
            <p className="text-sm text-blue-700">Parent Unit: {parentUnit?.ut_name || parentUnit?.unit_name}</p>
          </div>

          {/* Instructions */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              Select the child units you want to create entities for. Each selected unit will create a separate entity 
              with the format: <strong>"{entityName} (Unit Name)"</strong>
            </p>
          </div>

          {/* Select All */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAllToggle}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Select All ({childUnits.length} units)
              </span>
            </label>
          </div>

          {/* Child Units List */}
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
            {childUnits.map((unit, index) => {
              const isSelected = selectedUnits.some(selected => selected.ut_id === unit.ut_id);
              const entityVariantName = `${entityName} ${unit.ut_name || unit.unit_name} ${unit.ut_symbol}`;
              
              return (
                <div
                  key={unit.ut_id || unit.unit_id || index}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50' : ''
                  } ${index === childUnits.length - 1 ? 'border-b-0' : ''}`}
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleUnitToggle(unit)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900">
                        {entityVariantName}
                      </div>
                      <div className="text-sm text-gray-500">
                        Unit: {unit.ut_name || unit.unit_name}
                        {(unit.ut_symbol || unit.unit_symbol) && ` (${unit.ut_symbol || unit.unit_symbol})`}
                        {unit.ut_description && ` - ${unit.ut_description}`}
                      </div>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>

          {/* Selected Count */}
          {selectedUnits.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>{selectedUnits.length}</strong> entity variant{selectedUnits.length !== 1 ? 's' : ''} will be created
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Skip - Create Single Entity
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedUnits.length === 0}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create {selectedUnits.length} Entities
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChildUnitSelectionModal;