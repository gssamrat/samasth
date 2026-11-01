import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, UsersIcon, BuildingOffice2Icon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { partnersAPI } from '../services/api';
import toast from 'react-hot-toast';

const PartnersManagement = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // all, supplier, manufacturer
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    business_type: 'supplier', // supplier or manufacturer
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState({});

  const businessTypes = [
    {
      id: 'supplier',
      label: 'Supplier',
      description: 'Provides goods or services to your business',
      icon: BuildingOfficeIcon,
      emoji: '🏪',
      gradient: 'from-green-500 to-blue-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'manufacturer',
      label: 'Manufacturer',
      description: 'Produces or creates products for your business',
      icon: BuildingOffice2Icon,
      emoji: '🏭',
      gradient: 'from-blue-500 to-purple-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  const filterOptions = [
    { id: 'all', label: 'All Partners', emoji: '🤝' },
    { id: 'supplier', label: 'Suppliers', emoji: '🏪' },
    { id: 'manufacturer', label: 'Manufacturers', emoji: '🏭' }
  ];

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const response = await partnersAPI.getAll();
      setPartners(response.suppliers || response || []);
    } catch (error) {
      console.error('Failed to load partners:', error);
      toast.error('Failed to load business partners');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = `${getBusinessTypeLabel()} name is required`;
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getBusinessTypeLabel = () => {
    const type = businessTypes.find(t => t.id === formData.business_type);
    return type ? type.label : 'Partner';
  };

  const getFieldLabel = (field) => {
    const isManufacturer = formData.business_type === 'manufacturer';
    const labels = {
      name: isManufacturer ? 'Manufacturer Name' : 'Supplier Name',
      contact_person: isManufacturer ? 'Manufacturing Contact' : 'Supplier Contact',
      email: isManufacturer ? 'Manufacturing Email' : 'Supplier Email',
      phone: isManufacturer ? 'Manufacturing Phone' : 'Supplier Phone',
      address: isManufacturer ? 'Manufacturing Address' : 'Supplier Address'
    };
    return labels[field] || field;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (editingPartner) {
        await partnersAPI.update(editingPartner.s_id || editingPartner.id, formData);
        toast.success(`${getBusinessTypeLabel()} updated successfully`);
      } else {
        await partnersAPI.create(formData);
        toast.success(`${getBusinessTypeLabel()} created successfully`);
      }
      
      await loadPartners();
      resetForm();
    } catch (error) {
      console.error('Failed to save partner:', error);
      toast.error(editingPartner ? `Failed to update ${getBusinessTypeLabel().toLowerCase()}` : `Failed to create ${getBusinessTypeLabel().toLowerCase()}`);
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
      address: '',
      business_type: 'supplier',
      status: 'active'
    });
    setFormErrors({});
    setShowAddForm(false);
    setEditingPartner(null);
  };

  const handleEdit = (partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.s_name || partner.name || '',
      contact_person: partner.s_contact_person || partner.contact_person || '',
      email: partner.s_email || partner.email || '',
      phone: partner.s_phone || partner.phone || '',
      address: partner.s_address || partner.address || '',
      business_type: partner.s_type || partner.business_type || 'supplier',
      status: partner.s_status || partner.status || 'active'
    });
    setShowAddForm(true);
  };

  const handleDelete = async (partner) => {
    const partnerType = (partner.s_type || partner.business_type || 'partner').toLowerCase();
    if (!window.confirm(`Are you sure you want to delete this ${partnerType}: ${partner.s_name || partner.name}?`)) {
      return;
    }

    try {
      await partnersAPI.delete(partner.s_id || partner.id);
      toast.success(`${partnerType.charAt(0).toUpperCase() + partnerType.slice(1)} deleted successfully`);
      await loadPartners();
    } catch (error) {
      console.error('Failed to delete partner:', error);
      toast.error(`Failed to delete ${partnerType}`);
    }
  };

  const handleStatusToggle = async (partner) => {
    const currentStatus = partner.s_status || partner.status;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      await partnersAPI.updateStatus(partner.s_id || partner.id, newStatus);
      toast.success(`Partner ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      await loadPartners();
    } catch (error) {
      console.error('Failed to update partner status:', error);
      toast.error('Failed to update partner status');
    }
  };

  const filteredPartners = partners.filter(partner => {
    if (activeFilter === 'all') return true;
    return (partner.s_type || partner.business_type || 'supplier') === activeFilter;
  });

  const getPartnerTypeInfo = (partner) => {
    const type = partner.s_type || partner.business_type || 'supplier';
    return businessTypes.find(t => t.id === type) || businessTypes[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
              <UsersIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Business Partners</h1>
              <p className="text-gray-600 mt-1">Manage your suppliers and manufacturers</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <PlusIcon className="w-5 h-5" />
            {showAddForm ? 'Cancel' : 'Add Partner'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm mb-6">
        {filterOptions.map((filter) => {
          const isActive = activeFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 justify-center ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{filter.emoji}</span>
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Partners</p>
              <p className="text-2xl font-bold text-gray-900">{partners?.length || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <UsersIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">
                {partners?.filter(p => (p.s_type || p.business_type || 'supplier') === 'supplier').length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <BuildingOfficeIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Manufacturers</p>
              <p className="text-2xl font-bold text-gray-900">
                {partners?.filter(p => (p.s_type || p.business_type || 'supplier') === 'manufacturer').length || 0}
              </p>
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
                {partners?.filter(p => (p.s_status || p.status) === 'active').length || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-xl text-green-600">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingPartner ? `Edit ${getBusinessTypeLabel()}` : `Add New Business Partner`}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Business Type Selector - Card Based */}
            {!editingPartner && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type of Business Entity *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {businessTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.business_type === type.id;
                    
                    return (
                      <div
                        key={type.id}
                        onClick={() => setFormData({ ...formData, business_type: type.id })}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          isSelected
                            ? `${type.borderColor} ${type.bgColor} ring-2 ring-offset-2 ring-${type.id === 'supplier' ? 'green' : 'blue'}-400`
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3">
                            <div className={`w-5 h-5 bg-gradient-to-r ${type.gradient} rounded-full flex items-center justify-center`}>
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-white shadow-sm' : type.bgColor}`}>
                            <Icon className={`w-6 h-6 ${isSelected ? 'text-gray-700' : type.id === 'supplier' ? 'text-green-600' : 'text-blue-600'}`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{type.emoji}</span>
                              <h4 className="font-semibold text-gray-900">{type.label}</h4>
                            </div>
                            <p className="text-sm text-gray-600">{type.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getFieldLabel('name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={`Enter ${getBusinessTypeLabel().toLowerCase()} name`}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getFieldLabel('contact_person')}
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
                  {getFieldLabel('email')}
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
                  {getFieldLabel('phone')}
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

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getFieldLabel('address')}
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter complete ${getBusinessTypeLabel().toLowerCase()} address`}
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
                    {editingPartner ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  editingPartner ? `Update ${getBusinessTypeLabel()}` : `Create ${getBusinessTypeLabel()}`
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Partners List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            {activeFilter === 'all' ? `All Partners (${filteredPartners.length})` : 
             activeFilter === 'supplier' ? `Suppliers (${filteredPartners.length})` :
             `Manufacturers (${filteredPartners.length})`}
          </h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading partners...</span>
          </div>
        ) : filteredPartners.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPartners.map((partner, index) => {
                  const typeInfo = getPartnerTypeInfo(partner);
                  const Icon = typeInfo.icon;
                  
                  return (
                    <tr key={partner.s_id || partner.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 ${typeInfo.bgColor} rounded-lg`}>
                            <Icon className={`w-6 h-6 ${typeInfo.id === 'supplier' ? 'text-green-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{partner.s_name || partner.name}</h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                typeInfo.id === 'supplier' 
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {typeInfo.emoji} {typeInfo.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {(partner.s_contact_person || partner.contact_person) && (
                            <div className="font-medium">{partner.s_contact_person || partner.contact_person}</div>
                          )}
                          {(partner.s_email || partner.email) && (
                            <div className="text-gray-500">{partner.s_email || partner.email}</div>
                          )}
                          {(partner.s_phone || partner.phone) && (
                            <div className="text-gray-500">{partner.s_phone || partner.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {partner.s_address || partner.address || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleStatusToggle(partner)}
                          className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${
                            (partner.s_status || partner.status) === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {partner.s_status || partner.status || 'unknown'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(partner)}
                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors duration-200"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors duration-200">
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(partner)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors duration-200"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeFilter === 'all' ? 'No partners yet' :
               activeFilter === 'supplier' ? 'No suppliers yet' :
               'No manufacturers yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by adding your first {activeFilter === 'all' ? 'business partner' : activeFilter}
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary px-4 py-2 rounded-lg"
            >
              Add Your First {activeFilter === 'all' ? 'Partner' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnersManagement;
