import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SupplierForm = ({ formData, onChange, onGenerateCode }) => {
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const handleGenerateCode = async () => {
    if (!formData.name?.trim()) {
      toast.error('Please enter supplier name first');
      return;
    }

    setIsGeneratingCode(true);
    try {
      const generatedCode = await onGenerateCode(formData.name, 'supplier');
      onChange({ target: { name: 'code', value: generatedCode } });
      toast.success('Supplier code generated successfully!');
    } catch (error) {
      toast.error('Failed to generate code');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Supplier Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Supplier Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name || ''}
          onChange={onChange}
          placeholder="Enter supplier name"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          required
        />
      </div>

      {/* Supplier Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Supplier Code *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            name="code"
            value={formData.code || ''}
            onChange={onChange}
            placeholder="Enter or generate supplier code"
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

      {/* Contact Information */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Contact Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Person
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson || ''}
              onChange={onChange}
              placeholder="Enter contact person name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={onChange}
              placeholder="supplier@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={onChange}
              placeholder="Enter phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website || ''}
              onChange={onChange}
              placeholder="https://supplier-website.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Address Information</h4>
        
        {/* Street Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address || ''}
            onChange={onChange}
            placeholder="Enter street address"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formData.city || ''}
              onChange={onChange}
              placeholder="Enter city"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State/Province
            </label>
            <input
              type="text"
              name="state"
              value={formData.state || ''}
              onChange={onChange}
              placeholder="Enter state"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              name="postalCode"
              value={formData.postalCode || ''}
              onChange={onChange}
              placeholder="Enter postal code"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Business Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Type
            </label>
            <select
              name="supplierType"
              value={formData.supplierType || ''}
              onChange={onChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            >
              <option value="">Select supplier type</option>
              <option value="manufacturer">Manufacturer</option>
              <option value="distributor">Distributor</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="service_provider">Service Provider</option>
            </select>
          </div>

          {/* GST Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GST Number
            </label>
            <input
              type="text"
              name="gstNumber"
              value={formData.gstNumber || ''}
              onChange={onChange}
              placeholder="Enter GST number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>

          {/* PAN Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PAN Number
            </label>
            <input
              type="text"
              name="panNumber"
              value={formData.panNumber || ''}
              onChange={onChange}
              placeholder="Enter PAN number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Terms (Days)
            </label>
            <input
              type="number"
              name="paymentTerms"
              value={formData.paymentTerms || ''}
              onChange={onChange}
              placeholder="Enter payment terms"
              min="0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Products/Services */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Products/Services Supplied
          </label>
          <textarea
            name="productsServices"
            value={formData.productsServices || ''}
            onChange={onChange}
            placeholder="List the main products or services this supplier provides"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 resize-none"
          />
        </div>

        {/* Notes */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={onChange}
            placeholder="Additional notes about the supplier"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100 resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default SupplierForm;
