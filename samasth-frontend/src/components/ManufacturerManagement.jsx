import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { manufacturersAPI } from '../services/api';
import toast from 'react-hot-toast';

const ManufacturerManagement = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    location: '',
    description: '',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadManufacturers();
  }, []);

  const loadManufacturers = async () => {
    try {
      setLoading(true);
      const response = await manufacturersAPI.getAll();
      setManufacturers(response.manufacturers || response || []);
    } catch (error) {
      console.error('Failed to load manufacturers:', error);
      toast.error('Failed to load manufacturers');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Manufacturer name is required';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      errors.website = 'Please enter a valid website URL (include http:// or https://)';
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
      
      if (editingManufacturer) {
        await manufacturersAPI.update(editingManufacturer.id, formData);
        toast.success('Manufacturer updated successfully');
      } else {
        await manufacturersAPI.create(formData);
        toast.success('Manufacturer created successfully');
      }
      
      await loadManufacturers();
      resetForm();
    } catch (error) {
      console.error('Failed to save manufacturer:', error);
      toast.error(editingManufacturer ? 'Failed to update manufacturer' : 'Failed to create manufacturer');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      website: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      location: '',
      description: '',
      status: 'active'
    });
    setFormErrors({});
    setShowAddForm(false);
    setEditingManufacturer(null);
  };

  const handleEdit = (manufacturer) => {
    setEditingManufacturer(manufacturer);
    setFormData({
      name: manufacturer.name || '',
      contact_person: manufacturer.contact_person || '',
      email: manufacturer.email || '',
      phone: manufacturer.phone || '',
      website: manufacturer.website || '',
      address: manufacturer.address || '',
      city: manufacturer.city || '',
      state: manufacturer.state || '',
      postal_code: manufacturer.postal_code || '',
      country: manufacturer.country || 'India',
      location: manufacturer.location || '',
      description: manufacturer.description || '',
      status: manufacturer.status || 'active'
    });
    setShowAddForm(true);
  };

  const handleDelete = async (manufacturer) => {
    if (!window.confirm(`Are you sure you want to delete ${manufacturer.name}?`)) {
      return;
    }

    try {
      await manufacturersAPI.delete(manufacturer.id);
      toast.success('Manufacturer deleted successfully');
      await loadManufacturers();
    } catch (error) {
      console.error('Failed to delete manufacturer:', error);
      toast.error('Failed to delete manufacturer');
    }
  };

  const handleStatusToggle = async (manufacturer) => {
    const newStatus = manufacturer.status === 'active' ? 'inactive' : 'active';
    
    try {
      await manufacturersAPI.updateStatus(manufacturer.id, newStatus);
      toast.success(`Manufacturer ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      await loadManufacturers();
    } catch (error) {
      console.error('Failed to update manufacturer status:', error);
      toast.error('Failed to update manufacturer status');
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
              <BuildingOffice2Icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manufacturer Management</h1>
              <p className="text-gray-600 mt-1">Manage your manufacturers and their information</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PlusIcon className="w-5 h-5" />
            {showAddForm ? 'Cancel' : 'Add Manufacturer'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Manufacturers</p>
              <p className="text-2xl font-bold text-gray-900">{manufacturers?.length || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {manufacturers?.filter(m => m.status === 'active').length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-xl text-green-600">✅</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">
                {manufacturers?.filter(m => m.status === 'inactive').length || 0}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <span className="text-xl text-gray-600">⏸️</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">+{Math.floor(Math.random() * 5)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-xl text-purple-600">📈</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingManufacturer ? 'Edit Manufacturer' : 'Add New Manufacturer'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manufacturer Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter manufacturer name"
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter contact person name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {formErrors.email && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter phone number"
                />
                {formErrors.phone && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.phone}</p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.website ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://website.com"
                />
                {formErrors.website && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.website}</p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter street address"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter state"
                />
              </div>

              {/* Postal Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter postal code"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter manufacturer description (optional)"
                />
              </div>
            </div>

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
                    {editingManufacturer ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editingManufacturer ? 'Update Manufacturer' : 'Create Manufacturer'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manufacturers List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BuildingOffice2Icon className="w-5 h-5" />
            All Manufacturers ({manufacturers.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading manufacturers...</span>
          </div>
        ) : manufacturers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {manufacturers.map((manufacturer, index) => (
                  <tr key={manufacturer.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{manufacturer.name}</h4>
                          {manufacturer.website && (
                            <a 
                              href={manufacturer.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Visit Website
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {manufacturer.contact_person && (
                          <div className="font-medium">{manufacturer.contact_person}</div>
                        )}
                        {manufacturer.email && (
                          <div className="text-gray-500">{manufacturer.email}</div>
                        )}
                        {manufacturer.phone && (
                          <div className="text-gray-500">{manufacturer.phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {manufacturer.city && manufacturer.state 
                        ? `${manufacturer.city}, ${manufacturer.state}`
                        : manufacturer.city || manufacturer.state || '-'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleStatusToggle(manufacturer)}
                        className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${
                          manufacturer.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {manufacturer.status || 'unknown'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(manufacturer)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors duration-200"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors duration-200">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(manufacturer)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-200"
                        >
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
            <BuildingOffice2Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No manufacturers yet</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first manufacturer</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary px-4 py-2 rounded-lg"
            >
              Add Your First Manufacturer
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManufacturerManagement;
