import React, { useState } from 'react';
import toast from 'react-hot-toast';
import EntityTypeSelector from './EntityTypeSelector';
import ProductForm from './forms/ProductForm';
import CustomerForm from './forms/CustomerForm';
import SupplierForm from './forms/SupplierForm';
import { entityAPI } from '../services/api';

const AddEntityForm = ({ onAddEntity }) => {
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const handleEntityTypeSelect = (entityType) => {
    setSelectedEntityType(entityType.id);
    // Reset form data when entity type changes
    setFormData({
      name: '',
      code: ''
    });
  };

  const handleFormDataChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateCode = async (name, type) => {
    try {
      // For now, generate a simple code based on name and type
      // In production, this would call the backend API
      const prefix = type.toUpperCase().substring(0, 3);
      const timestamp = Date.now().toString().slice(-4);
      const nameCode = name.replace(/\s+/g, '').toUpperCase().substring(0, 3);
      const generatedCode = `${prefix}-${nameCode}-${timestamp}`;
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return generatedCode;
    } catch (error) {
      throw new Error('Failed to generate code');
    }
  };

  const validateForm = () => {
    if (!selectedEntityType) {
      toast.error('Please select an entity type');
      return false;
    }
    
    if (!formData.name?.trim()) {
      toast.error('Please enter entity name');
      return false;
    }
    
    if (!formData.code?.trim()) {
      toast.error('Please enter or generate entity code');
      return false;
    }

    // Entity-specific validation
    if (selectedEntityType === 'product' && formData.hasGst === true) {
      if (!formData.gstPercentage || formData.gstPercentage <= 0) {
        toast.error('Please enter valid GST percentage');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let result;
      
      // Call appropriate API based on entity type
      switch (selectedEntityType) {
        case 'product':
          result = await entityAPI.createProduct(formData);
          break;
        case 'customer':
          result = await entityAPI.createCustomer(formData);
          break;
        case 'supplier':
          result = await entityAPI.createSupplier(formData);
          break;
        default:
          throw new Error('Invalid entity type');
      }
      
      // Notify parent component
      if (onAddEntity) {
        await onAddEntity(result);
      }
      
      toast.success(`${selectedEntityType.charAt(0).toUpperCase() + selectedEntityType.slice(1)} created successfully!`);
      
      // Reset form
      setSelectedEntityType('');
      setFormData({});
    } catch (error) {
      console.error('Error creating entity:', error);
      toast.error(error.message || `Failed to create ${selectedEntityType}`);
    } finally {
      setLoading(false);
    }
  };

  const renderEntityForm = () => {
    const commonProps = {
      formData,
      onChange: handleFormDataChange,
      onGenerateCode: handleGenerateCode
    };

    switch (selectedEntityType) {
      case 'product':
        return <ProductForm {...commonProps} />;
      case 'customer':
        return <CustomerForm {...commonProps} />;
      case 'supplier':
        return <SupplierForm {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
          <span className="text-2xl">🏢</span>
          Entity Management
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Create and manage different types of entities in your system
        </p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Entity Type Selector */}
          <div>
            <EntityTypeSelector 
              selectedType={selectedEntityType}
              onTypeSelect={handleEntityTypeSelect}
            />
          </div>


          {/* Dynamic Form Based on Entity Type */}
          {selectedEntityType && (
            <div className="border-t border-gray-200 pt-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  {selectedEntityType === 'product' && '📦'}
                  {selectedEntityType === 'customer' && '👤'}
                  {selectedEntityType === 'supplier' && '🏢'}
                  {selectedEntityType.charAt(0).toUpperCase() + selectedEntityType.slice(1)} Details
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Fill in the information for the new {selectedEntityType}
                </p>
              </div>
              {renderEntityForm()}
            </div>
          )}

          {/* Submit Button */}
          {selectedEntityType && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 inline-flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating {selectedEntityType}...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">✨</span>
                      Create {selectedEntityType.charAt(0).toUpperCase() + selectedEntityType.slice(1)}
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEntityType('');
                    setFormData({});
                  }}
                  disabled={loading}
                  className="btn-secondary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddEntityForm;
