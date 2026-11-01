import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { entityAPI } from '../services/api';

const ItemDetailsForm = ({ item, entityId, onSave, onCancel }) => {
  const [detailsData, setDetailsData] = useState({
    itemMadeBy: '',
    batchNo: '',
    mrp: '',
    purchasePrice: '',
    sellingPrice: '',
    setSellPriceAuto: false,
    providerId: '',
    quantity: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDetailsData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!detailsData.itemMadeBy || !detailsData.batchNo || !detailsData.mrp || 
        !detailsData.purchasePrice || !detailsData.sellingPrice || !detailsData.providerId) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await entityAPI.createEntityDetail({
        ...detailsData,
        entityId: entityId
      });
      toast.success('Entity detail created successfully!');
      onSave({ ...item, ...detailsData, id: response.id });
    } catch (error) {
      console.error('Error creating entity detail:', error);
      toast.error('Failed to create entity detail. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add Details for {item.name}</h2>
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Item Made By <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="itemMadeBy"
                value={detailsData.itemMadeBy}
                onChange={handleInputChange}
                placeholder="Enter organization ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Batch No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="batchNo"
                value={detailsData.batchNo}
                onChange={handleInputChange}
                placeholder="Enter batch number"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                MRP <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="mrp"
                value={detailsData.mrp}
                onChange={handleInputChange}
                placeholder="Enter MRP"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Purchase Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="purchasePrice"
                value={detailsData.purchasePrice}
                onChange={handleInputChange}
                placeholder="Enter purchase price"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Selling Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="sellingPrice"
                value={detailsData.sellingPrice}
                onChange={handleInputChange}
                placeholder="Enter selling price"
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Provider ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="providerId"
                value={detailsData.providerId}
                onChange={handleInputChange}
                placeholder="Enter provider ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={detailsData.quantity}
                onChange={handleInputChange}
                placeholder="Enter quantity"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
              />
            </div>

            <div className="space-y-2 flex items-center">
              <input
                type="checkbox"
                name="setSellPriceAuto"
                checked={detailsData.setSellPriceAuto}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="ml-2 text-sm font-semibold text-gray-700">
                Set Sell Price Auto
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Save Details'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemDetailsForm;