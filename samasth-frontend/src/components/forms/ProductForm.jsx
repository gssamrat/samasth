import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ProductForm = ({ formData, onChange, onGenerateCode }) => {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const handleGenerateCode = async () => {
    if (!formData.name?.trim()) {
      toast.error('Please enter product name first');
      return;
    }

    setIsGeneratingCode(true);
    try {
      const generatedCode = await onGenerateCode(formData.name, 'product');
      onChange({ target: { name: 'code', value: generatedCode } });
      toast.success('Product code generated successfully!');
    } catch (error) {
      toast.error('Failed to generate code');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleGstToggle = (hasGst) => {
    onChange({ target: { name: 'hasGst', value: hasGst } });
    if (!hasGst) {
      onChange({ target: { name: 'gstPercentage', value: '' } });
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name || ''}
          onChange={onChange}
          placeholder="Enter product name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          required
        />
      </div>

      {/* Product Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Code *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            name="code"
            value={formData.code || ''}
            onChange={onChange}
            placeholder="Enter or generate product code"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            required
          />
          <button
            type="button"
            onClick={handleGenerateCode}
            disabled={isGeneratingCode || !formData.name?.trim()}
            className="btn-primary px-4 py-3 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingCode ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <SparklesIcon className="w-4 h-4" />
            )}
            {isGeneratingCode ? 'Generating...' : 'Generate'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Enter a custom code or click generate to create one automatically
        </p>
      </div>

      {/* GST Section */}
      <div className="border-t border-gray-200 pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          GST Applicable
        </label>
        
        {/* GST Toggle */}
        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={() => handleGstToggle(true)}
            className={`gst-toggle px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              formData.hasGst === true
                ? 'btn-success text-white'
                : 'btn-secondary'
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => handleGstToggle(false)}
            className={`gst-toggle px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              formData.hasGst === false
                ? 'btn-danger text-white'
                : 'btn-secondary'
            }`}
          >
            No
          </button>
        </div>

        {/* GST Percentage Input */}
        {formData.hasGst === true && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GST Percentage *
            </label>
            <div className="relative">
              <input
                type="number"
                name="gstPercentage"
                value={formData.gstPercentage || ''}
                onChange={onChange}
                placeholder="Enter GST percentage"
                min="0"
                max="100"
                step="0.01"
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
                required
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                %
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Additional Product Information */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Additional Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category || ''}
              onChange={onChange}
              placeholder="Product category"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            <input
              type="text"
              name="brand"
              value={formData.brand || ''}
              onChange={onChange}
              placeholder="Product brand"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={onChange}
            placeholder="Product description"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
