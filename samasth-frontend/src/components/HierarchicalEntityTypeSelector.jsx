import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { entityTypesAPI } from '../services/api';
import toast from 'react-hot-toast';
import AddEntityTypeModal from './AddEntityTypeModal';

const HierarchicalEntityTypeSelector = ({ value, onChange, error }) => {
  const [entityTypes, setEntityTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [showApiTypes, setShowApiTypes] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [allEntityTypes, setAllEntityTypes] = useState([]); // Store all types including children
  const [showAddEntityType, setShowAddEntityType] = useState(false);

  // Helper function to get appropriate icon based on name/description
  const getRelevantIcon = (name, description) => {
    const text = (name + ' ' + description).toLowerCase();
    
    // Food and beverages
    if (text.includes('grocery') || text.includes('food')) return '🍎';
    if (text.includes('spice')) return '🌶️';
    if (text.includes('drink') || text.includes('beverage') || text.includes('cool')) return '🥤';
    if (text.includes('dairy') || text.includes('milk')) return '🥛';
    if (text.includes('meat') || text.includes('chicken')) return '🍗';
    if (text.includes('vegetable') || text.includes('veg')) return '🥕';
    if (text.includes('fruit')) return '🍏';
    
    // Categories
    if (text.includes('electronics') || text.includes('electronic')) return '📱';
    if (text.includes('clothing') || text.includes('apparel')) return '👕';
    if (text.includes('book') || text.includes('education')) return '📚';
    if (text.includes('medicine') || text.includes('health')) return '💊';
    if (text.includes('tool') || text.includes('hardware')) return '🔧';
    if (text.includes('cosmetic') || text.includes('beauty')) return '💄';
    
    // Default icons by type
    if (text.includes('service')) return '🛠️';
    if (text.includes('material') || text.includes('raw')) return '🧱';
    if (text.includes('equipment')) return '⚙️';
    
    // Fallback
    return '📁';
  };
  
  // Fallback entity types with better design
  const fallbackEntityTypes = [
    { id: 'product', name: 'Product', description: 'Items for sale or inventory' },
    { id: 'service', name: 'Service', description: 'Services offered to customers' },
    { id: 'material', name: 'Raw Material', description: 'Raw materials for production' },
    { id: 'equipment', name: 'Equipment', description: 'Tools and machinery' }
  ];

  useEffect(() => {
    loadEntityTypes();
  }, []);

  useEffect(() => {
    if (value) {
      findSelectedType(value);
    }
  }, [value, allEntityTypes]);

  const loadEntityTypes = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading entity types...');
      
      // Try to load from API first
      const response = await entityTypesAPI.getRoot();
      console.log('📋 API Response:', response);
      
      // Handle the actual API response format with children included
      const entityTypesData = response?.entity_types || response || [];
      
      if (Array.isArray(entityTypesData) && entityTypesData.length > 0) {
        // Process the hierarchical data
        const processEntityTypes = (types, parentId = null) => {
          return types.map((type, index) => {
            const processedType = {
              et_id: type.et_id || `api-${index}`,
              et_name: type.et_name || `Type ${index + 1}`,
              et_description: type.et_description || 'API Entity Type',
              et_parent_id: type.parent_id || parentId,
              et_unit_type:type.et_unit_type,
              icon: getRelevantIcon(type.et_name || '', type.et_description || ''),
              has_children: Array.isArray(type.children) && type.children.length > 0,
              children: []
            };
            
            // Process children if they exist
            if (processedType.has_children) {
              processedType.children = processEntityTypes(type.children, processedType.et_id);
            }
            
            return processedType;
          });
        };
        
        const processedTypes = processEntityTypes(entityTypesData);
        
        // Store root level types for display
        const rootTypes = processedTypes.filter(type => !type.et_parent_id);
        
        // Store all types (including children) for search/selection
        const flattenTypes = (types) => {
          let flattened = [];
          types.forEach(type => {
            flattened.push(type);
            if (type.children && type.children.length > 0) {
              flattened = flattened.concat(flattenTypes(type.children));
            }
          });
          return flattened;
        };
        
        const allTypes = flattenTypes(processedTypes);
        
        setEntityTypes(rootTypes);
        setAllEntityTypes(allTypes);
        setShowApiTypes(true);
        console.log('✅ Loaded API entity types:', rootTypes.length, 'root,', allTypes.length, 'total');
      } else {
        // Fallback to predefined types with hierarchical structure
        const hierarchicalFallback = fallbackEntityTypes.map(type => ({
          et_id: type.id,
          et_name: type.name,
          et_description: type.description,
          et_parent_id: null,
          et_unit_type:type.unitType,
          icon: getRelevantIcon(type.name, type.description),
          has_children: true,
          children: [
            {
              et_id: `${type.id}-sub1`,
              et_name: `${type.name} Category 1`,
              et_description: `Sample subcategory of ${type.name}`,
              et_parent_id: type.id,
              et_unit_type:type.unitType,
              icon: '📄',
              has_children: false,
              children: []
            },
            {
              et_id: `${type.id}-sub2`,
              et_name: `${type.name} Category 2`,
              et_description: `Sample subcategory of ${type.name}`,
              et_parent_id: type.id,
              et_unit_type:type.unitType,
              icon: '📄',
              has_children: false,
              children: []
            }
          ]
        }));
        
        const allFallbackTypes = [];
        hierarchicalFallback.forEach(parent => {
          allFallbackTypes.push(parent);
          allFallbackTypes.push(...parent.children);
        });
        
        setEntityTypes(hierarchicalFallback);
        setAllEntityTypes(allFallbackTypes);
        setShowApiTypes(false);
        console.log('📦 Using fallback entity types');
      }
    } catch (error) {
      console.error('❌ Failed to load entity types:', error);
      toast.error('Failed to load entity types, using defaults');
      
      // Use fallback types on error with hierarchical structure  
      const hierarchicalFallback = fallbackEntityTypes.map(type => ({
        et_id: type.id,
        et_name: type.name,
        et_description: type.description,
        et_parent_id: null,
        icon: getRelevantIcon(type.name, type.description),
        has_children: true,
        children: [
          {
            et_id: `${type.id}-sub1`,
            et_name: `${type.name} Category 1`,
            et_description: `Sample subcategory of ${type.name}`,
            et_parent_id: type.id,
            icon: '📄',
            has_children: false,
            children: []
          }
        ]
      }));
      
      const allFallbackTypes = [];
      hierarchicalFallback.forEach(parent => {
        allFallbackTypes.push(parent);
        allFallbackTypes.push(...parent.children);
      });
      
      setEntityTypes(hierarchicalFallback);
      setAllEntityTypes(allFallbackTypes);
      setShowApiTypes(false);
    } finally {
      setLoading(false);
    }
  };

  // Children are now included in the initial API response, so no separate loading needed

  const findSelectedType = (typeId) => {
    // Look in all entity types (including children)
    const found = allEntityTypes.find(type => type.et_id === typeId);
    
    if (found) {
      setSelectedType(found);
    }
  };

  const handleSelectType = (type) => {
    setSelectedType(type);
    onChange(type.et_id, type);
  };

  const toggleExpand = (type) => {
    const newExpanded = new Set(expandedNodes);
    
    if (expandedNodes.has(type.et_id)) {
      newExpanded.delete(type.et_id);
    } else {
      newExpanded.add(type.et_id);
    }
    
    setExpandedNodes(newExpanded);
  };

  const handleEntityTypeCreated = (newEntityType) => {
    // Refresh the entity types list after creation
    loadEntityTypes();
    console.log('New entity type created:', newEntityType);
  };

  const renderEntityTypeItem = (type, level = 0) => {
    const isSelected = value === type.et_id;
    const isExpanded = expandedNodes.has(type.et_id);
    const children = type.children || [];
    const paddingLeft = level * 20; // 20px per level
    
    return (
      <div key={type.et_id}>
        {/* Main Item */}
        <div 
          className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-blue-100 text-blue-900 border border-blue-300' 
              : 'hover:bg-gray-50 border border-transparent'
          }`}
          style={{ paddingLeft: `${paddingLeft + 8}px` }}
          onClick={() => handleSelectType(type)}
        >
          {/* Expand/Collapse Button for parents */}
          {type.has_children ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(type);
              }}
              className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-5 flex-shrink-0"></div> // Spacer for alignment
          )}
          
          {/* Icon */}
          <span className="text-lg flex-shrink-0">{type.icon}</span>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium truncate ${
                isSelected ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {type.et_name}
              </span>
              {isSelected && (
                <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
              )}
            </div>
            {level === 0 && type.et_description && (
              <p className={`text-xs truncate ${
                isSelected ? 'text-blue-700' : 'text-gray-500'
              }`}>
                {type.et_description}
              </p>
            )}
          </div>
        </div>
        
        {/* Children Items */}
        {isExpanded && children.length > 0 && (
          <div className="space-y-1">
            {children.map(child => renderEntityTypeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Entity Type *
        </label>
        <p className="text-xs text-gray-500 mb-4">
          {loading 
            ? 'Loading entity types...'
            : showApiTypes 
              ? 'Expand categories to see subcategories'
              : 'Select from available entity types'
          }
        </p>
      </div>
      
      {loading ? (
        <div className="border border-gray-200 rounded-lg p-3 bg-white">
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <div className="w-5 h-5 bg-gray-300 rounded"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-300 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
        {/* Compact Hierarchical List */}
        <div className="border border-gray-200 rounded-lg bg-white max-h-48 overflow-y-auto">
          {entityTypes.length > 0 ? (
            <div className="p-1">
              {entityTypes
                .filter(type => !type.et_parent_id) // Only show root level types
                .map(type => renderEntityTypeItem(type))
              }
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl block mb-2">📂</span>
              <p className="text-sm">No entity types available</p>
            </div>
          )}
        </div>
      
      {/* Add Entity Type Button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={() => setShowAddEntityType(true)}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span className="text-lg">➕</span>
          <span className="text-sm font-medium">Add New Entity Type</span>
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
      
        {/* Selection Confirmation */}
        {selectedType && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 text-sm">
              <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-blue-600 font-medium">Selected:</span>
              <span className="text-base">{selectedType.icon}</span>
              <span className="text-blue-900 font-medium">{selectedType.et_name}</span>
            </div>
          </div>
        )}
      
        {/* Simple Status */}
        {!loading && !showApiTypes && (
          <div className="text-xs text-amber-600 mt-1">
            Using default types
          </div>
        )}
        </>
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

export default HierarchicalEntityTypeSelector;
