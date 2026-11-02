import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import HierarchicalEntityTypeSelector from './HierarchicalEntityTypeSelector';
import ManufacturerSelector from './ManufacturerSelector';
import ChildUnitSelectionModal from './ChildUnitSelectionModal';
import HsnLookupModal from './HsnLookupModal';
import { entityAPI, unitAPI } from '../services/api';
import toast from 'react-hot-toast';

const EntityManagementPage = () => {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    entity_type_id: '',
    manufacturer_id: '', // Backend expects manufacturer ID from selector
    // manufacturer: '', // Commented - was string input
    weight: '',
    // unit: 'kg', // Commented - removed unit selector per backend struct
    // description: '', // Commented - replaced with remarks
    remarks: '',
    barcode: '',
    hsn: '',
    // status: 'active' // Commented - not in backend struct
  });
  const [formErrors, setFormErrors] = useState({});
  const [showChildUnitModal, setShowChildUnitModal] = useState(false);
  const [showHsnLookup, setShowHsnLookup] = useState(false);
  const [selectedEntityType, setSelectedEntityType] = useState(null);
  const [childUnits, setChildUnits] = useState([]);
  const [pendingEntityVariants, setPendingEntityVariants] = useState([]);

  useEffect(() => {
    loadEntities();
  }, []);

  const loadEntities = async () => {
    try {
      setLoading(true);
      const response = await entityAPI.getAllEntities();
      setEntities(response.entities || response || []);
    } catch (error) {
      console.error('Failed to load entities:', error);
      toast.error('Failed to load entities');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Entity name is required';
    }
    
    if (!formData.entity_type_id) {
      errors.entity_type_id = 'Entity type is required';
    }

    // Only require barcode if no variants are selected
    if (pendingEntityVariants.length === 0 && !formData.barcode.trim()) {
      errors.barcode = 'Barcode is required';
    }
    
    // Only validate weight if no variants are selected
    if (pendingEntityVariants.length === 0 && formData.weight && isNaN(parseFloat(formData.weight))) {
      errors.weight = 'Weight must be a valid number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (editingEntity) {
        await entityAPI.updateEntity(editingEntity.e_id || editingEntity.id, formData);
        toast.success('Entity updated successfully');
      } else {
        // Check if we have entity variants to create
        if (pendingEntityVariants.length > 0) {
          // Create multiple entities based on selected child units
          const createdEntities = [];
          
          for (const variant of pendingEntityVariants) {
            const entityData = {
              ...formData,
              name: variant.name,
              // Add unit-specific data
              unit_type_id: variant.unitId,
              unit_name: variant.unitName,
              // Use unit name as weight and empty barcode for variants
              weight: variant.unitName,
              barcode: '', // Empty barcode for variants
              e_related: 'y'
            };
            createdEntities.push(entityData);
           
          }
          console.log('array prepared : ', createdEntities);
          try {
             await entityAPI.createEntityVariants(createdEntities);
            
          } catch (error) {
            console.error(`Failed to create entity variant:`, error);
            toast.error(`Failed to create`);
          }
          
          if (createdEntities.length > 0) {
            toast.success(`Successfully created ${createdEntities.length} entity variants`);
          }
        } else {
          // Create single entity
          await entityAPI.createEntity(formData);
          toast.success('Entity created successfully');
        }
      }
      
      await loadEntities();
      resetForm();
    } catch (error) {
      console.error('Failed to save entity:', error);
      toast.error(editingEntity ? 'Failed to update entity' : 'Failed to create entity');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      entity_type_id: '',
      manufacturer_id: '', // Backend expects manufacturer ID from selector
      // manufacturer: '', // Commented - was string input
      weight: '',
      // unit: 'kg', // Commented - removed unit selector per backend struct
      // description: '', // Commented - replaced with remarks
      remarks: '',
      barcode: '',
      hsn: '',
      // status: 'active' // Commented - not in backend struct
    });
    setFormErrors({});
    setShowAddForm(false);
    setEditingEntity(null);
    setShowChildUnitModal(false);
    setSelectedEntityType(null);
    setChildUnits([]);
    setPendingEntityVariants([]);
  };

  const handleEdit = (entity) => {
    setEditingEntity(entity);
    setFormData({
      name: entity.e_name || entity.name || '',
      entity_type_id: entity.et_id || entity.entity_type_id || '',
      manufacturer_id: entity.e_manufacturer || entity.manufacturer_id || '', // Backend expects manufacturer ID
      // manufacturer: entity.e_manufacturer || entity.manufacturer || '', // Commented - was string input
      weight: entity.e_weight || entity.weight || '',
      // unit: entity.unit || 'kg', // Commented - removed unit selector per backend struct
      remarks: entity.e_remarks || entity.description || '',
      barcode: entity.e_barcode || entity.barcode || '',
      hsn: entity.hsn || '',
      // status: entity.status || 'active' // Commented - not in backend struct
    });
    setShowAddForm(true);
  };

  // Handle entity type selection with child unit checking
  const handleEntityTypeChange = async (typeId, typeData) => {
    setFormData({ ...formData, entity_type_id: typeId });
    setSelectedEntityType(typeData);
    
    // Clear any pending entity variants
    setPendingEntityVariants([]);
    
    // Check if this entity type has child units
    if (typeId && formData.name) {
      await checkForChildUnits(typeId, typeData);
    }
  };

  // Check if the selected unit type has child units
  const checkForChildUnits = async (unitTypeId, unitTypeData) => {
    if (!formData.name.trim()) {
      toast.error('Please enter entity name first');
      return;
    }

    try {
      console.log('Checking for child units for unit type:', unitTypeId);
      const childUnitsResponse = await unitAPI.getChildren(unitTypeData.et_unit_type);
      console.log('Child units response:', childUnitsResponse);
      
      // Handle different response structures
      let childUnitsArray = [];
      if (Array.isArray(childUnitsResponse)) {
        childUnitsArray = childUnitsResponse;
      } else if (childUnitsResponse && Array.isArray(childUnitsResponse.unit_types)) {
        childUnitsArray = childUnitsResponse.unit_types;
      } else if (childUnitsResponse && Array.isArray(childUnitsResponse.data)) {
        childUnitsArray = childUnitsResponse.data;
      }
      
      if (childUnitsArray.length > 0) {
        console.log('Found child units:', childUnitsArray);
        setChildUnits(childUnitsArray);
        setShowChildUnitModal(true);
      } else {
        console.log('No child units found');
      }
    } catch (error) {
      console.error('Error checking for child units:', error);
      // Don't show error to user, just proceed normally
    }
  };

  // Handle child unit selection confirmation
  const handleChildUnitConfirm = (entityVariants) => {
    setShowChildUnitModal(false);
    
    if (entityVariants.length > 0) {
      setPendingEntityVariants(entityVariants);
      toast.success(`Ready to create ${entityVariants.length} entity variants`);
    } else {
      // User chose to skip, proceed with single entity
      setPendingEntityVariants([]);
    }
  };

  // Handle name change and trigger child unit check if entity type is selected
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData(prev => ({ ...prev, name: newName }));
    
    // Clear pending variants when name changes
    setPendingEntityVariants([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <span className="text-2xl text-white">🏢</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Entity Management</h1>
              <p className="text-gray-600 mt-1">Create and manage your business entities</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
          >
            <PlusIcon className="w-5 h-5" />
            {showAddForm ? 'Cancel' : 'Add Entity'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Entities</p>
              <p className="text-2xl font-bold text-gray-900">{entities?.length || 0}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <span className="text-xl text-gray-600">📊</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {entities?.filter(e => e.status === 'active').length || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <span className="text-xl text-gray-600">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">
                {entities?.filter(e => e.status === 'inactive').length || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <span className="text-xl text-gray-600">⏸️</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">+{Math.floor(Math.random() * 10)}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <span className="text-xl text-gray-600">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingEntity ? 'Edit Entity' : 'Add New Entity'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Entity Name */}
              <div >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entity Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter entity name"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                )}
              </div>

              <div >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer
                </label>
                <ManufacturerSelector
                  value={formData.manufacturer_id}
                  onChange={(manufacturerId) => setFormData({ ...formData, manufacturer_id: manufacturerId })}
                  placeholder="Search for a manufacturer..."
                  error={formErrors.manufacturer_id}
                />
                {/* Commented - was string input before backend clarification
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter manufacturer name"
                />
                */}
              </div>

              {/* Entity Type */}
              <div>
                <HierarchicalEntityTypeSelector
                  value={formData.entity_type_id}
                  onChange={handleEntityTypeChange}
                  error={formErrors.entity_type_id}
                />
              </div>

               {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter remarks (optional)"
                />
              </div>

               <div >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HSN
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.hsn || ''}
                    onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
                    className={`flex-1 min-w-0 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.hsn ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter HSN"
                  />
                  <button
                    type="button"
                    onClick={() => setShowHsnLookup(true)}
                    className="shrink-0 whitespace-nowrap"
                  >
                    🔍 Lookup
                  </button>
                </div>
                {formErrors.hsn && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.hsn}</p>
                )}
              </div>

              <div >
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST % Applicable (Based on HSN)
                </label>
                <input
                  type="text"
                  value={formData.hsn}
                  onChange={handleNameChange}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.hsn ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter HSN"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight {pendingEntityVariants.length > 0 && (
                    <span className="text-orange-600 text-xs">(Auto-filled for variants)</span>
                  )}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  disabled={pendingEntityVariants.length > 0}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.weight ? 'border-red-300' : 'border-gray-300'
                  } ${pendingEntityVariants.length > 0 ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder={pendingEntityVariants.length > 0 ? "Auto-filled for each variant" : "0.00"}
                />
                {formErrors.weight && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.weight}</p>
                )}
                {pendingEntityVariants.length > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Each variant will use its unit name as weight value
                  </p>
                )}
              </div>

              {/* Barcode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode {pendingEntityVariants.length === 0 && <span className="text-red-500">*</span>}
                  {pendingEntityVariants.length > 0 && (
                    <span className="text-orange-600 text-xs">(Left empty for variants)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  disabled={pendingEntityVariants.length > 0}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.barcode ? 'border-red-300' : 'border-gray-300'
                  } ${pendingEntityVariants.length > 0 ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                  placeholder={pendingEntityVariants.length > 0 ? "Will be left empty for variants" : "Enter barcode"}
                />
                {formErrors.barcode && pendingEntityVariants.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.barcode}</p>
                )}
                {pendingEntityVariants.length > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Barcode field will be empty for all variants
                  </p>
                )}
              </div>

             
            </div>

            {/* Pending Entity Variants */}
            {pendingEntityVariants.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3">
                  📋 Ready to Create {pendingEntityVariants.length} Entity Variants
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {pendingEntityVariants.map((variant, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-blue-200">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{variant.name}</div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>Unit: {variant.unitName} {variant.unitSymbol && `(${variant.unitSymbol})`}</div>
                          <div className="flex gap-4">
                            <span>Weight: <span className="font-medium text-orange-600">{variant.unitName}</span></span>
                            <span>Barcode: <span className="font-medium text-gray-400">(empty)</span></span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingEntityVariants(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="text-red-600 hover:text-red-800 p-1 ml-3"
                        title="Remove variant"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-blue-700">💡 Tip:</span>
                  <span className="text-blue-600">
                    All variants will be created when you click "Create Entity"
                  </span>
                  <button
                    type="button"
                    onClick={() => setPendingEntityVariants([])}
                    className="ml-auto text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-6 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editingEntity ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editingEntity ? 'Update Entity' : 'Create Entity'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

{/*
       { Entities List }
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className="text-xl">📋</span>
            All Entities ({entities.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading entities...</span>
          </div>
        ) : entities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entities.map((entity, index) => (
                  <tr key={entity.e_id || entity.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <span className="text-lg">🏢</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{entity.e_name || entity.name}</h4>
                          {(entity.e_remarks || entity.description) && (
                            <p className="text-sm text-gray-500 truncate">{entity.e_remarks || entity.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                        {entity.entity_type?.et_name || entity.EntityType?.et_name || entity.entity_type || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entity.e_manufacturer || entity.manufacturer || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entity.e_weight || entity.weight ? `${entity.e_weight || entity.weight}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {entity.e_barcode || entity.barcode || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(entity)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors duration-200"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors duration-200">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-200">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="text-6xl text-gray-300 block mb-4">🏢</span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No entities yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first entity</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary px-4 py-2 rounded-lg"
            >
              Add Your First Entity
            </button>
          </div>
        )}
      </div>
      */}
      {/* Child Unit Selection Modal */}
      <ChildUnitSelectionModal
        isOpen={showChildUnitModal}
        onClose={() => setShowChildUnitModal(false)}
        onConfirm={handleChildUnitConfirm}
        entityName={formData.name}
        parentUnit={selectedEntityType}
        childUnits={childUnits}
      />

      {/* HSN Lookup Modal */}
      <HsnLookupModal isOpen={showHsnLookup} onClose={() => setShowHsnLookup(false)} />
    </div>
  );
};

export default EntityManagementPage;
