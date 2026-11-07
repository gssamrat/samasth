// Hindi translations
const hi = {
  // Common/Global
  common: {
    save: 'सेव करें',
    cancel: 'रद्द करें',
    delete: 'डिलीट करें',
    edit: 'एडिट करें',
    add: 'जोड़ें',
    remove: 'हटाएं',
    search: 'खोजें',
    loading: 'लोड हो रहा है...',
    yes: 'हां',
    no: 'नहीं',
    confirm: 'पुष्टि करें',
    back: 'वापस',
    next: 'अगला',
    finish: 'समाप्त',
    close: 'बंद करें',
    submit: 'सबमिट करें',
    reset: 'रीसेट करें',
    clear: 'साफ करें',
    select: 'चुनें',
    upload: 'अपलोड करें',
    download: 'डाउनलोड करें',
    print: 'प्रिंट करें',
    export: 'एक्सपोर्ट करें',
    import: 'इम्पोर्ट करें',
    refresh: 'रीफ्रेश करें',
    update: 'अपडेट करें',
    systemOnline: 'सिस्टम ऑनलाइन',
    version: 'संस्करण',
    confirmLogout: 'क्या आप वाकई लॉगआउट करना चाहते हैं?',
    selectLanguage: 'भाषा चुनें',
    languagePreferenceSaved: 'भाषा प्राथमिकता सहेजी गई',
    create: 'बनाएं',
    view: 'देखें',
    details: 'विवरण',
    settings: 'सेटिंग्स',
    help: 'सहायता',
    logout: 'लॉगआउट',
    login: 'लॉगिन',
    welcome: 'स्वागत है',
    error: 'त्रुटि',
    success: 'सफलता',
    warning: 'चेतावनी',
    info: 'जानकारी'
  },

  // Navigation/Sidebar
  navigation: {
    dashboard: 'डैशबोर्ड',
    home: 'होम',
    entityManagement: 'एंटिटी मैनेजमेंट',
    businessPartners: 'व्यापारिक साझेदार',
    stockManagement: 'स्टॉक मैनेजमेंट',
    supplyEntry: 'आपूर्ति प्रविष्टि',
    search: 'खोजें',
    sales: 'बिक्री',
    generateCoupon: 'कूपन जेनरेट करें',
    reports: 'रिपोर्ट्स',
    userManagement: 'यूजर मैनेजमेंट',
    settings: 'सेटिंग्स',
    logout: 'लॉगआउट'
  },

  // Dashboard
  dashboard: {
    title: 'डैशबोर्ड',
    welcome: 'डैशबोर्ड में आपका स्वागत है',
    totalStock: 'कुल स्टॉक',
    lowStock: 'कम स्टॉक आइटम्स',
    todaySales: 'आज की बिक्री',
    monthlyRevenue: 'मासिक आय',
    recentActivities: 'हाल की गतिविधियां',
    quickActions: 'त्वरित कार्य'
  },

  // Stock Management
  stock: {
    title: 'स्टॉक मैनेजमेंट',
    addStock: 'स्टॉक जोड़ें',
    editStock: 'स्टॉक एडिट करें',
    stockEntry: 'स्टॉक एंट्री',
    bulkEntry: 'बल्क एंट्री',
    flashEntry: 'फ्लैश एंट्री',
    productName: 'प्रोडक्ट का नाम',
    quantity: 'मात्रा',
    price: 'कीमत',
    mrp: 'एमआरपी',
    purchaseRate: 'खरीद दर',
    sellingPrice: 'बिक्री मूल्य',
    batchNumber: 'बैच नंबर',
    expiryDate: 'समाप्ति तिथि',
    manufactureDate: 'निर्माण तिथि',
    barcode: 'बारकोड',
    supplier: 'आपूर्तिकर्ता',
    manufacturer: 'निर्माता',
    category: 'श्रेणी',
    description: 'विवरण',
    notes: 'नोट्स'
  },

  // Coupon Management
  coupon: {
    title: 'कूपन जेनरेट करें',
    flashMode: 'फ्लैश मोड',
    sequentialMode: 'क्रमिक मोड',
    customerName: 'ग्राहक का नाम',
    mobileNumber: 'मोबाइल नंबर',
    billAmount: 'बिल की राशि',
    billNumber: 'बिल नंबर',
    village: 'गांव',
    generateCoupon: 'कूपन जेनरेट करें',
    couponGenerated: 'कूपन सफलतापूर्वक जेनरेट हुआ',
    couponCode: 'कूपन कोड',
    totalCoupons: 'कुल जारी कूपन',
    highAmountAlert: 'अधिक बिल राशि चेतावनी',
    highAmountMessage: 'आपने ₹{amount} की बिल राशि दर्ज की है। यह एक बड़ी राशि है और {count} कूपन जेनरेट करेगी। कृपया पुष्टि करें कि यह इच्छित राशि है।',
    confirmGenerate: 'हां, कूपन जेनरेट करें',
    checkAmount: 'नहीं, मुझे जांचने दें',
    generationCancelled: 'कूपन जेनरेशन रद्द हो गई। कृपया बिल राशि की पुष्टि करें।'
  },

  // Forms
  forms: {
    required: 'यह फील्ड आवश्यक है',
    invalidEmail: 'कृपया एक वैध ईमेल पता दर्ज करें',
    invalidPhone: 'कृपया एक वैध फोन नंबर दर्ज करें',
    invalidAmount: 'कृपया एक वैध राशि दर्ज करें',
    fillAllFields: 'कृपया सभी आवश्यक फील्ड भरें',
    saveSuccess: 'सफलतापूर्वक सेव हो गया',
    updateSuccess: 'सफलतापूर्वक अपडेट हो गया',
    deleteSuccess: 'सफलतापूर्वक डिलीट हो गया',
    deleteConfirm: 'क्या आप वाकई इस आइटम को डिलीट करना चाहते हैं?',
    unsavedChanges: 'आपके पास अनसेव्ड बदलाव हैं। क्या आप जाने से पहले सेव करना चाहते हैं?'
  },

  // Entity Management
  entity: {
    title: 'एंटिटी मैनेजमेंट',
    addEntity: 'एंटिटी जोड़ें',
    editEntity: 'एंटिटी एडिट करें',
    entityName: 'एंटिटी का नाम',
    entityCode: 'एंटिटी कोड',
    entityType: 'एंटिटी प्रकार',
    weight: 'वजन',
    dimensions: 'आयाम',
    searchEntities: 'एंटिटी खोजें'
  },

  // Business Partners
  partners: {
    title: 'व्यापारिक साझेदार',
    suppliers: 'आपूर्तिकर्ता',
    manufacturers: 'निर्माता',
    customers: 'ग्राहक',
    addPartner: 'साझेदार जोड़ें',
    partnerName: 'साझेदार का नाम',
    contactPerson: 'संपर्क व्यक्ति',
    phone: 'फोन',
    email: 'ईमेल',
    address: 'पता'
  },

  // Sales
  sales: {
    title: 'बिक्री',
    newSale: 'नई बिक्री',
    saleHistory: 'बिक्री इतिहास',
    saleAmount: 'बिक्री राशि',
    saleDate: 'बिक्री तिथि',
    customer: 'ग्राहक',
    items: 'आइटम्स',
    total: 'कुल',
    discount: 'छूट',
    tax: 'कर',
    grandTotal: 'महायोग'
  },

  // Reports
  reports: {
    title: 'रिपोर्ट्स',
    salesReport: 'बिक्री रिपोर्ट',
    stockReport: 'स्टॉक रिपोर्ट',
    couponReport: 'कूपन रिपोर्ट',
    dateRange: 'तिथि सीमा',
    fromDate: 'से तिथि',
    toDate: 'तक तिथि',
    generateReport: 'रिपोर्ट जेनरेट करें'
  },

  // User Management
  users: {
    title: 'यूजर मैनेजमेंट',
    addUser: 'यूजर जोड़ें',
    editUser: 'यूजर एडिट करें',
    username: 'यूजरनेम',
    fullName: 'पूरा नाम',
    role: 'भूमिका',
    status: 'स्थिति',
    permissions: 'अनुमतियां',
    lastLogin: 'अंतिम लॉगिन'
  }
};

export default hi;
