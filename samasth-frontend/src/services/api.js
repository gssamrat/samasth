import axios from 'axios';

// Get API_BASE_URL from environment variables with fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Log the API base URL in development for debugging
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const entityAPI = {
  // Get all entities
  getAllEntities: async () => {
    const response = await api.get('/entities');
    return response.data;
  },

  // Get single entity by ID
  getEntity: async (id) => {
    const response = await api.get(`/entities/${id}`);
    return response.data;
  },

  // Create new entity (updated for new schema)
  createEntity: async (entityData) => {
    // Transform frontend data to backend format
    const backendData = {
      e_name: entityData.name || entityData.e_name,
      et_id: entityData.entity_type_id || entityData.et_id,
      e_manufacturer: entityData.manufacturer || entityData.e_manufacturer || '',
      e_weight: entityData.weight || entityData.e_weight || 0,
      e_remarks: entityData.remarks || entityData.description || entityData.e_remarks || '',
      e_barcode: entityData.barcode || entityData.e_barcode || '',
      e_related_to_e: entityData.e_related || ''
    };
    const response = await api.post('/entities', backendData);
    return response.data;
  },

  createEntityVariants: async (entityDataVariants) => {
    const backEndData = [];

    for (const variant of entityDataVariants) {
      const entityData = {
        e_name: variant.name || variant.e_name,
        et_id: variant.entity_type_id || variant.et_id,
        e_manufacturer: variant.manufacturer || variant.e_manufacturer || '',
        e_weight: variant.weight || variant.e_weight || 0,
        e_remarks: variant.remarks || variant.description || variant.e_remarks || '',
        e_barcode: variant.barcode || variant.e_barcode || '',
        e_related_to_e: variant.e_related || ''
      };

      backEndData.push(entityData);
    }
    const response = await api.post('/entities/entityvariants', backEndData);
    return response;
  },

  // Update entity
  updateEntity: async (id, entityData) => {
    // Transform frontend data to backend format
    const backendData = {
      e_name: entityData.name || entityData.e_name,
      et_id: entityData.entity_type_id || entityData.et_id,
      e_manufacturer: entityData.manufacturer || entityData.e_manufacturer || '',
      e_weight: entityData.weight || entityData.e_weight || 0,
      e_remarks: entityData.remarks || entityData.description || entityData.e_remarks || '',
      e_barcode: entityData.barcode || entityData.e_barcode || ''
    };
    const response = await api.put(`/entities/${id}`, backendData);
    return response.data;
  },

  // Create Product entity with specific data
  createProduct: async (productData) => {
    const entityData = {
      name: productData.name,
      type: 'product',
      code: productData.code,
      additionalData: {
        category: productData.category,
        brand: productData.brand,
        description: productData.description,
        has_gst: productData.hasGst,
        gst_percentage: productData.gstPercentage
      }
    };
    return await entityAPI.createEntity(entityData);
  },

  // Create Customer entity with specific data
  createCustomer: async (customerData) => {
    const entityData = {
      name: customerData.name,
      type: 'customer',
      code: customerData.code,
      additionalData: {
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city,
        state: customerData.state,
        postal_code: customerData.postalCode,
        customer_type: customerData.customerType,
        gst_number: customerData.gstNumber,
        notes: customerData.notes
      }
    };
    return await entityAPI.createEntity(entityData);
  },

  // Create Supplier entity with specific data
  createSupplier: async (supplierData) => {
    const entityData = {
      name: supplierData.name,
      type: 'supplier',
      code: supplierData.code,
      additionalData: {
        contact_person: supplierData.contactPerson,
        email: supplierData.email,
        phone: supplierData.phone,
        website: supplierData.website,
        address: supplierData.address,
        city: supplierData.city,
        state: supplierData.state,
        postal_code: supplierData.postalCode,
        supplier_type: supplierData.supplierType,
        gst_number: supplierData.gstNumber,
        pan_number: supplierData.panNumber,
        payment_terms: supplierData.paymentTerms,
        products_services: supplierData.productsServices,
        notes: supplierData.notes
      }
    };
    return await entityAPI.createEntity(entityData);
  },

  // Generate entity code
  generateEntityCode: async (name, type) => {
    const response = await api.post('/entities/generate-code', {
      name,
      type
    });
    return response.data.code;
  },

  createEntityDetail: async (entityDetailData) => {
    // Map frontend data structure to backend expected format
    const backendData = {
      e_id: entityDetailData.entityId, // Link to the entity via foreign key
      ed_make_by_org_id: entityDetailData.itemMadeBy,
      EntityDetailAttribute: {
        eda_batch_no: entityDetailData.batchNo,
        eda_mrp: entityDetailData.mrp,
        eda_p_price: entityDetailData.purchasePrice,
        eda_s_price: entityDetailData.sellingPrice,
        eda_s_price_set_auto: entityDetailData.setSellPriceAuto,
        eda_provider_id: entityDetailData.providerId,
        eda_quantity: entityDetailData.quantity
      }
    };
    alert(backendData);
    const response = await api.post('/entity-detail', backendData);
    return response.data;
  },

  // Generate coupon
  generateCoupon: async (couponData) => {
    // Map frontend data to backend expected format if needed
    const backendData = {
      name: couponData.name,
      bill_amount: couponData.billAmount,
      bill_number: couponData.billNumber,
      mobile_no: couponData.mobileNo,
      village: couponData.village,
      exclude_amt: couponData.excludeAmt
    };
    const response = await api.post('/coupons/generate', backendData);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    // Use the api instance instead of axios directly
    // This ensures consistent configuration and behavior
    const response = await api.get('/health');
    return response.data;
  },

  // Unified search
  search: async (query) => {
    const response = await api.get('/search', { params: { q: query } });
    return response.data; // expected: { resultType: string, results: any[] }
  },

  searchEntity: async (query) => {
    const response = await api.get('/searchEntity', { params: { q: query } });
    return response.data; // expected: { resultType: string, results: any[] }
  },

  // Fetch villages with autocomplete
  fetchVillage: async (query) => {
    const response = await api.get('/villages', { params: { q: query } });
    return response.data; // expected: array of village names or village objects
  },

  fetchCouponsCount: async () => {
    const response = await api.get('/fetchCouponCount');
    return response.data;
  },

  // Generate custom sticker
  generateCustomSticker: async (stickerData) => {
    const backendData = {
      line1: stickerData.line1,
      line2: stickerData.line2,
      line3: stickerData.line3,
      copies: parseInt(stickerData.copies)
    };
    const response = await api.post('/customsticker', backendData);
    return response.data;
  }
};

// Entity Types API
export const entityTypesAPI = {
  // Get all entity types
  getAll: async () => {
    const response = await api.get('/entity-types');
    return response.data;
  },

  // Get root/top-level categories
  getRoot: async () => {
    const response = await api.get('/entity-types/root');
    return response.data;
  },

  // Get specific entity type
  getById: async (id) => {
    const response = await api.get(`/entity-types/${id}`);
    return response.data;
  },

  // Get child categories by parent ID
  getChildren: async (parentId) => {
    const response = await api.get(`/entity-types/parent/${parentId}`);
    return response.data;
  },

  // Create entity type
  create: async (entityTypeData) => {
    const response = await api.post('/entity-types', entityTypeData);
    return response.data;
  },

  // Update entity type
  update: async (id, entityTypeData) => {
    const response = await api.put(`/entity-types/${id}`, entityTypeData);
    return response.data;
  },

  // Delete entity type
  delete: async (id) => {
    const response = await api.delete(`/entity-types/${id}`);
    return response.data;
  }
};

// Partners API (handles both suppliers and manufacturers)
export const partnersAPI = {
  // Get all suppliers (paginated)
  getAll: async (params = {}) => {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },

  // Search suppliers by name
  search: async (query) => {
    const response = await api.get('/suppliers/search', { params: { q: query } });
    return response.data;
  },

  // Filter suppliers by status
  getByStatus: async (status) => {
    const response = await api.get(`/suppliers/status/${status}`);
    return response.data;
  },

  // Get specific supplier
  getById: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  // Create supplier
  create: async (supplierData) => {
    // Transform frontend data to backend format
    const backendData = {
      s_name: supplierData.name || supplierData.s_name,
      s_contact_person: supplierData.contact_person || supplierData.s_contact_person,
      s_email: supplierData.email || supplierData.s_email,
      s_phone: supplierData.phone || supplierData.s_phone,
      s_address: supplierData.address || supplierData.s_address,
      s_status: supplierData.status || supplierData.s_status || 'active',
      s_type: supplierData.business_type || supplierData.s_type || 'supplier' // Add business type
    };
    const response = await api.post('/suppliers', backendData);
    return response.data;
  },

  // Update supplier
  update: async (id, supplierData) => {
    // Transform frontend data to backend format
    const backendData = {
      s_name: supplierData.name || supplierData.s_name,
      s_contact_person: supplierData.contact_person || supplierData.s_contact_person,
      s_email: supplierData.email || supplierData.s_email,
      s_phone: supplierData.phone || supplierData.s_phone,
      s_address: supplierData.address || supplierData.s_address,
      s_status: supplierData.status || supplierData.s_status,
      s_type: supplierData.business_type || supplierData.s_type || 'supplier'
    };
    const response = await api.put(`/suppliers/${id}`, backendData);
    return response.data;
  },

  // Update supplier status only
  updateStatus: async (id, status) => {
    const response = await api.patch(`/suppliers/${id}/status`, { s_status: status });
    return response.data;
  },

  // Delete supplier
  delete: async (id) => {
    const response = await api.delete(`/suppliers/${id}`);
    return response.data;
  },

  // Get partners by type (supplier or manufacturer)
  getByType: async (type, params = {}) => {
    const response = await api.get('/suppliers', {
      params: { ...params, s_type: type }
    });
    return response.data;
  }
};

// Legacy alias
export const suppliersAPI = partnersAPI;
export const manufacturersAPI = partnersAPI;

// Stock Inventory Management API
export const stockAPI = {
  // Get all stock records (paginated)
  getAll: async (filters = {}) => {
    const response = await api.get('/stock-inventory', { params: filters });
    return response.data;
  },

  // Get specific stock record by ID
  getById: async (id) => {
    const response = await api.get(`/stock-inventory/${id}`);
    return response.data;
  },

  // Create new stock record
  create: async (stockData) => {
    // Transform frontend data to match backend StockRequest structure
    const backendData = {
      s_barcode: stockData.s_barcode || stockData.barcode || null,
      s_bp_man_id: stockData.s_bp_man_id || stockData.manufacturer_id || null,
      s_sysbarcode_1: stockData.s_sysbarcode_1 || stockData.system_barcode || null,
      s_eid: stockData.s_eid || stockData.entity_id || stockData.product_id || null,
      s_mrp: stockData.s_mrp || stockData.mrp || null,
      s_purchase_value: stockData.s_purchase_value || stockData.purchase_rate || stockData.purchase_price || null,
      s_sale_value: stockData.s_sale_value || stockData.selling_price || stockData.sale_price || null,
      s_qty: stockData.s_qty || stockData.quantity || null,
      s_bp_sup_id: stockData.s_bp_sup_id || stockData.supplier_id || null,
      s_batchno: stockData.s_batchno || stockData.batch_number || stockData.batchNo || null,
      s_manfacture_dt: stockData.s_manfacture_dt || stockData.manufacture_date || null,
      s_expirydt: stockData.s_expirydt || stockData.expiry_date || null
    };

    const response = await api.post('/stock-inventory', backendData);
    return response.data;
  },

  // Update stock entry
  update: async (id, stockData) => {
    // Transform frontend data to match backend StockRequest structure
    const backendData = {
      s_barcode: stockData.s_barcode || stockData.barcode || null,
      s_bp_man_id: stockData.s_bp_man_id || stockData.manufacturer_id || null,
      s_sysbarcode_1: stockData.s_sysbarcode_1 || stockData.system_barcode || null,
      s_eid: stockData.s_eid || stockData.entity_id || stockData.product_id || null,
      s_mrp: stockData.s_mrp || stockData.mrp || null,
      s_purchase_value: stockData.s_purchase_value || stockData.purchase_rate || stockData.purchase_price || null,
      s_sale_value: stockData.s_sale_value || stockData.selling_price || stockData.sale_price || null,
      s_qty: stockData.s_qty || stockData.quantity || null,
      s_bp_sup_id: stockData.s_bp_sup_id || stockData.supplier_id || null,
      s_batchno: stockData.s_batchno || stockData.batch_number || stockData.batchNo || null,
      s_manfacture_dt: stockData.s_manfacture_dt || stockData.manufacture_date || null,
      s_expirydt: stockData.s_expirydt || stockData.expiry_date || null
    };

    const response = await api.put(`/stock-inventory/${id}`, backendData);
    return response.data;
  },

  // Delete stock entry
  delete: async (id) => {
    const response = await api.delete(`/stock-inventory/${id}`);
    return response.data;
  },

  // Legacy methods for backward compatibility with existing forms
  addStock: async (stockData) => {
    return await stockAPI.create(stockData);
  },

  getAllStock: async () => {
    return await stockAPI.getAll();
  },

  getStockByProduct: async (productId) => {
    // Filter by entity ID in the frontend since there's no specific endpoint
    const allStock = await stockAPI.getAll();
    return allStock.filter(stock =>
      stock.s_eid === productId ||
      stock.s_eid === productId.toString() ||
      stock.s_eid === parseInt(productId)
    );
  },

  updateStock: async (stockId, updateData) => {
    return await stockAPI.update(stockId, updateData);
  },

  // Additional utility methods for the new structure
  getStockByBarcode: async (barcode) => {
    const allStock = await stockAPI.getAll();
    return allStock.filter(stock => stock.s_barcode === barcode || stock.s_sysbarcode_1 === barcode);
  },

  getStockBySupplier: async (supplierId) => {
    const allStock = await stockAPI.getAll();
    return allStock.filter(stock => stock.s_bp_sup_id === supplierId);
  },

  getStockByManufacturer: async (manufacturerId) => {
    const allStock = await stockAPI.getAll();
    return allStock.filter(stock => stock.s_bp_man_id === manufacturerId);
  },

  // Get low stock items (items with quantity below threshold)
  getLowStock: async (threshold = 10) => {
    const allStock = await stockAPI.getAll();
    return allStock.filter(stock => stock.s_qty && stock.s_qty < threshold);
  },

  // Get expired items
  getExpiredStock: async () => {
    const allStock = await stockAPI.getAll();
    const today = new Date();
    return allStock.filter(stock => {
      if (!stock.s_expirydt) return false;
      const expiryDate = new Date(stock.s_expirydt);
      return expiryDate < today;
    });
  },

  getStockForSale: async (stockbarcode) => {
    const response = await api.get(`/stock/${stockbarcode}`);
    return response.data;
  }
};

// Sticker Printing API
export const stickerAPI = {
  // Print Operations
  print: async (printData) => {
    const response = await api.post('/stickers/print', printData);
    return response.data;
  },

  preview: async (previewData) => {
    const response = await api.post('/stickers/preview', previewData);
    return response.data;
  },

  // Validation & Testing
  validateZPL: async (zplContent) => {
    const response = await api.post('/stickers/validate-zpl', { zpl_content: zplContent });
    return response.data;
  },

  testPrinter: async (printerAddress) => {
    const response = await api.post('/stickers/test-printer', { address: printerAddress });
    return response.data;
  },

  // Job Management
  getJobs: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/stickers/jobs', { params });
    return response.data;
  },

  getJob: async (jobId) => {
    const response = await api.get(`/stickers/jobs/${jobId}`);
    return response.data;
  },

  deleteJob: async (jobId) => {
    const response = await api.delete(`/stickers/jobs/${jobId}`);
    return response.data;
  },

  updateJobStatus: async (jobId, status) => {
    const response = await api.patch(`/stickers/jobs/${jobId}/status`, { status });
    return response.data;
  },

  // Analytics & Configuration
  getStats: async () => {
    const response = await api.get('/stickers/stats');
    return response.data;
  },

  getPrinterConfigs: async () => {
    const response = await api.get('/stickers/printer-configs');
    return response.data;
  },

  getPrinterJobs: async (printerAddress) => {
    const response = await api.get(`/stickers/printers/${printerAddress}/jobs`);
    return response.data;
  }
};

// Authentication API
export const authAPI = {
  // Authentication
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getAvailablePages: async () => {
    const response = await api.get('/auth/pages');
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  },

  // User Management
  createUser: async (userData) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  getUser: async (userId) => {
    const response = await api.get(`/auth/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/auth/users/${userId}`, userData);
    return response.data;
  },

  deactivateUser: async (userId) => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },

  // Session Management
  getUserSessions: async () => {
    const response = await api.get('/auth/sessions');
    return response.data;
  },

  getAllActiveSessions: async () => {
    const response = await api.get('/auth/active-sessions');
    return response.data;
  },

  getAuthStats: async () => {
    const response = await api.get('/auth/stats');
    return response.data;
  }
};

// Unit API
export const unitAPI = {
  // Get all units
  getAll: async () => {
    const response = await api.get('/units');
    return response.data;
  },

  // Get root/top-level units
  getRoot: async () => {
    const response = await api.get('/units/root');
    return response.data;
  },

  // Get specific unit
  getById: async (id) => {
    const response = await api.get(`/units/${id}`);
    return response.data;
  },

  // Get child unit types by parent ID
  getChildren: async (parentId) => {
    const response = await api.get(`/unit-types/parent/${parentId}`);
    return response.data;
  },

  // Create unit
  create: async (unitData) => {
    const response = await api.post('/unit-types', unitData);
    return response.data;
  },

  // Update unit
  update: async (id, unitData) => {
    const response = await api.put(`/units/${id}`, unitData);
    return response.data;
  },

  // Delete unit
  delete: async (id) => {
    const response = await api.delete(`/units/${id}`);
    return response.data;
  },

  // Get unit hierarchy (parent with children)
  getHierarchy: async (unitId) => {
    const response = await api.get(`/units/${unitId}/hierarchy`);
    return response.data;
  }
};
// Client-side Print API
export const clientPrintAPI = {
  // Generate ZPL for browser printing
  generate: async (printData) => {
    const response = await api.post('/client-print/generate', printData);
    return response.data;
  },

  // Generate ZPL only (no job tracking)
  generateZPLOnly: async (printData) => {
    const response = await api.post('/client-print/generate-zpl-only', printData);
    return response.data;
  },

  // Get client print jobs
  getJobs: async () => {
    const response = await api.get('/client-print/jobs');
    return response.data;
  },

  // Send status updates from client
  statusCallback: async (statusData) => {
    const response = await api.post('/client-print/status-callback', statusData);
    return response.data;
  },

  // Get client printer configurations
  getPrinters: async () => {
    const response = await api.get('/client-print/printers');
    return response.data;
  },

  // Get currently processing jobs
  getActiveJobs: async () => {
    const response = await api.get('/client-print/active-jobs');
    return response.data;
  }
};

// Dashboard API
export const dashboardAPI = {
  // Get overall dashboard statistics
  getOverallStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Get sales statistics
  getSalesStats: async (period = '30d') => {
    const response = await api.get('/dashboard/sales', { params: { period } });
    return response.data;
  },

  // Get inventory/stock statistics
  getInventoryStats: async () => {
    const response = await api.get('/dashboard/inventory');
    return response.data;
  },

  // Get low stock alerts
  getLowStockAlerts: async () => {
    const response = await api.get('/dashboard/low-stock');
    return response.data;
  },

  // Get recent activities
  getRecentActivities: async (limit = 10) => {
    const response = await api.get('/dashboard/activities', { params: { limit } });
    return response.data;
  },

  // Get todo/pending tasks
  getTodoStats: async () => {
    const response = await api.get('/dashboard/todos');
    return response.data;
  },

  // Get financial summary
  getFinancialStats: async (period = '30d') => {
    const response = await api.get('/dashboard/financial', { params: { period } });
    return response.data;
  },

  // Get top products
  getTopProducts: async (limit = 5) => {
    const response = await api.get('/dashboard/top-products', { params: { limit } });
    return response.data;
  },

  // Get customer statistics
  getCustomerStats: async () => {
    const response = await api.get('/dashboard/customers');
    return response.data;
  },

  // Get supplier statistics
  getSupplierStats: async () => {
    const response = await api.get('/dashboard/suppliers');
    return response.data;
  }
};

export default api;
