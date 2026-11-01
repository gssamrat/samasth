import React, { useState } from 'react';
import AddEntityTypeModal from './AddEntityTypeModal';

const EntityTypeSelector = ({ selectedType, onTypeSelect }) => {
  const [showAddEntityType, setShowAddEntityType] = useState(false);
  
  const entityTypes = [
    { 
      id: 'product', 
      label: 'Product', 
      description: 'Items for sale or inventory',
      icon: '📦',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      id: 'customer', 
      label: 'Customer', 
      description: 'People who buy products/services',
      icon: '👤',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      id: 'supplier', 
      label: 'Supplier', 
      description: 'Vendors who provide products/services',
      icon: '🏢',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const handleTypeSelect = (type) => {
    onTypeSelect(type);
  };

  const handleEntityTypeCreated = (newEntityType) => {
    // You can add logic here to refresh the entity types list if needed
    // For now, we'll just show a success message since the list is static
    console.log('New entity type created:', newEntityType);
    // In a real scenario, you'd fetch the updated list from the API
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Select Entity Type *
        </label>
        <p className="text-sm text-gray-600 mb-6">
          Choose the type of entity you want to create
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {entityTypes.map((type) => {
          const isSelected = selectedType === type.id;
          
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleTypeSelect(type)}
              className={`
                entity-type-btn relative p-6 rounded-xl border-2 transition-all duration-300 text-left
                ${isSelected 
                  ? `${type.borderColor} ${type.bgColor} shadow-lg transform scale-105` 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md hover:scale-102'
                }
              `}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className={`absolute top-3 right-3 w-6 h-6 bg-gradient-to-r ${type.color} rounded-full flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              {/* Icon */}
              <div className="mb-3">
                <span className="text-3xl">{type.icon}</span>
              </div>
              
              {/* Content */}
              <div>
                <h3 className={`text-lg font-semibold mb-2 ${
                  isSelected ? 'text-gray-900' : 'text-gray-800'
                }`}>
                  {type.label}
                </h3>
                <p className={`text-sm ${
                  isSelected ? 'text-gray-700' : 'text-gray-600'
                }`}>
                  {type.description}
                </p>
              </div>
              
              {/* Hover Effect */}
              <div className={`
                absolute inset-0 rounded-xl transition-all duration-300 opacity-0
                ${isSelected ? 'opacity-100' : 'hover:opacity-10'}
                bg-gradient-to-r ${type.color}
              `} />
            </button>
          );
        })}
      </div>
      
      {/* Add Entity Type Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setShowAddEntityType(true)}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-3"
        >
          <span className="text-2xl">➕</span>
          <div className="text-center">
            <div className="font-medium">Add New Entity Type</div>
            <div className="text-xs mt-1 opacity-75">Create a custom entity type</div>
          </div>
        </button>
      </div>
      
      {selectedType && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">✓</span>
            <span className="text-sm font-medium text-blue-900">
              {entityTypes.find(t => t.id === selectedType)?.label} selected
            </span>
          </div>
        </div>
      )}
      
      {/* Add Entity Type Modal */}
      <AddEntityTypeModal
        isOpen={showAddEntityType}
        onClose={() => setShowAddEntityType(false)}
        onEntityTypeCreated={handleEntityTypeCreated}
      />
    </div>
  );
};

export default EntityTypeSelector;
