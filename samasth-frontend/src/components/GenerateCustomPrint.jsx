import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { entityAPI } from '../services/api';

const GenerateCustomPrint = () => {
  const [formData, setFormData] = useState({
    line1: '',
    line2: '',
    line3: '',
    copies: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeNumeric = (e) => {
    let input = e.target.value.replace(/\D/g, ""); // digits only
    if (input === '') input = '1'; // default to 1
    if (parseInt(input) > 999) input = '999'; // max 999 copies
    setFormData(prev => ({ ...prev, [e.target.name]: input }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.line1) {
      toast.error('Line 1 is required');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await entityAPI.generateCustomSticker(formData);
      
      toast.success('Custom sticker generated successfully');
      
      // Print via local print server
      await fetch("http://localhost:8081/customsticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line1: formData.line1,
          line2: formData.line2,
          line3: formData.line3,
          copies: parseInt(formData.copies)
        })
      });
      
      toast.success(`Printed ${formData.copies} sticker${formData.copies > 1 ? 's' : ''}`);
      
      // Reset form
      setFormData({ line1: '', line2: '', line3: '', copies: 1 });
    } catch (err) {
      toast.error('Failed to generate custom sticker');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
              <span className="text-2xl">🏷️</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Generate Custom Print</h1>
              <p className="text-gray-600 mt-0.5 text-sm">Create custom sticker prints with your text</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="line1"
                value={formData.line1}
                onChange={handleChange}
                autoComplete="off"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter first line of text"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Line 2 <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                name="line2"
                value={formData.line2}
                onChange={handleChange}
                autoComplete="off"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter second line of text"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Line 3 <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                name="line3"
                value={formData.line3}
                onChange={handleChange}
                autoComplete="off"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter third line of text"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Copies <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="copies"
                value={formData.copies}
                onChange={handleChangeNumeric}
                min="1"
                max="999"
                autoComplete="off"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setFormData({ line1: '', line2: '', line3: '', copies: 1 })}
                className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.line1}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </div>
                ) : (
                  'Generate & Print'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">How to use</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Line 1 is required and will be the main text on the sticker</li>
                <li>• Line 2 and Line 3 are optional for additional information</li>
                <li>• Specify the number of copies you want to print (1-999)</li>
                <li>• Click "Generate & Print" to create and print your custom stickers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateCustomPrint;
