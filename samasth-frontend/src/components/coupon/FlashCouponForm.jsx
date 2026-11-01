import React, { useState, useEffect, useRef } from 'react';
import { 
  TicketIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  DocumentTextIcon,
  UserIcon,
  MapPinIcon,
  SparklesIcon,
  ArrowRightIcon,
  XMarkIcon,
  CheckIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { entityAPI } from '../../services/api';
import VillageAutocomplete from '../VillageAutocomplete';
import ConfirmationModal from '../common/ConfirmationModal';
import { useLocalization } from '../../contexts/LocalizationContext';

const FlashCouponForm = ({ onCouponGenerated }) => {
  const [formData, setFormData] = useState({
    name: '',
    billAmount: '',
    billNumber: '',
    mobileNo: '',
    village: '',
    excludeAmt: '0'
  });
  const { t } = useLocalization();
  // Flash modal states
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [fieldValue, setFieldValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [couponCount, setCouponCount] = useState(0);
  
  // Confirmation modal states
  const [showAmountConfirmModal, setShowAmountConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  const fieldRefs = useRef([]);

  // Define form steps for flash modals
  const flashSteps = [
    { 
      name: 'mobileNo', 
      label: 'Mobile Number', 
      type: 'tel', 
      placeholder: 'Enter 10-digit mobile number',
      icon: '📱',
      description: 'Enter the customer\'s mobile number for coupon verification',
      required: true,
      maxLength: 10,
      pattern: '[0-9]*'
    },
    { 
      name: 'billAmount', 
      label: 'Bill Amount', 
      type: 'number', 
      step: '0.01',
      min: '0',
      placeholder: 'Enter bill amount',
      icon: '💰',
      description: 'Enter the total bill amount for coupon calculation',
      required: true
    },
    { 
      name: 'billNumber', 
      label: 'Bill Number', 
      type: 'text', 
      placeholder: 'Enter bill/invoice number',
      icon: '📄',
      description: 'Enter the bill or invoice number for reference',
      required: true
    },
    { 
      name: 'excludeAmt', 
      label: 'Exclude Amount', 
      type: 'number', 
      step: '0.01',
      min: '0',
      placeholder: 'Amount to exclude (default: 0)',
      icon: '➖',
      description: 'Enter amount to exclude from coupon calculation (optional)',
      required: false
    },
    { 
      name: 'name', 
      label: 'Customer Name', 
      type: 'text', 
      placeholder: 'Enter customer name',
      icon: '👤',
      description: 'Enter the customer\'s name (optional)',
      required: false
    },
    { 
      name: 'village', 
      label: 'Village', 
      type: 'autocomplete', 
      placeholder: 'Start typing village name...',
      icon: '📍',
      description: 'Select the customer\'s village (optional)',
      required: false
    }
  ];

  // Load coupon count on mount
  useEffect(() => {
    loadCouponCount();
  }, []);

  const loadCouponCount = async () => {
    try {
      const response = await entityAPI.fetchCouponsCount();
      setCouponCount(response);
    } catch (error) {
      console.error("Error fetching coupon count:", error);
    }
  };

  const startFlashForm = () => {
    setCurrentField(0);
    setFieldValue(formData[flashSteps[0].name] || '');
    setShowFlashModal(true);
  };

  const handleFlashNext = () => {
    if (currentField !== null) {
      const currentStep = flashSteps[currentField];
      
      // Validate required fields
      if (currentStep.required && !fieldValue.trim()) {
        toast.error(`${currentStep.label} is required`);
        return;
      }

      // Validate mobile number
      if (currentStep.name === 'mobileNo' && fieldValue.length !== 10) {
        toast.error('Mobile number must be exactly 10 digits');
        return;
      }

      // Save current field value
      const newFormData = {
        ...formData,
        [flashSteps[currentField].name]: fieldValue
      };
      setFormData(newFormData);

      // Move to next field or finish
      if (currentField < flashSteps.length - 1) {
        const nextField = currentField + 1;
        setCurrentField(nextField);
        setFieldValue(newFormData[flashSteps[nextField].name] || '');
      } else {
        setShowFlashModal(false);
        setCurrentField(null);
      }
    }
  };

  const handleFlashBack = () => {
    if (currentField > 0) {
      // Save current field value
      const newFormData = {
        ...formData,
        [flashSteps[currentField].name]: fieldValue
      };
      setFormData(newFormData);

      const prevField = currentField - 1;
      setCurrentField(prevField);
      setFieldValue(newFormData[flashSteps[prevField].name] || '');
    }
  };

  const editField = (stepIndex) => {
    // Save current field value if modal is open
    if (currentField !== null) {
      setFormData(prev => ({
        ...prev,
        [flashSteps[currentField].name]: fieldValue
      }));
    }
    
    setCurrentField(stepIndex);
    setFieldValue(formData[flashSteps[stepIndex].name] || '');
    setShowFlashModal(true);
  };

  const handleFieldChange = (value) => {
    if (currentField !== null) {
      const currentStep = flashSteps[currentField];
      
      // Handle numeric input for mobile number
      if (currentStep.name === 'mobileNo') {
        const numericValue = value.replace(/\D/g, '');
        if (numericValue.length <= 10) {
          setFieldValue(numericValue);
        }
      } else {
        setFieldValue(value);
      }
    }
  };

  const validateForm = () => {
    if (!formData.mobileNo || formData.mobileNo.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!formData.billAmount || parseFloat(formData.billAmount) <= 0) {
      toast.error('Please enter a valid bill amount');
      return false;
    }
    if (!formData.billNumber.trim()) {
      toast.error('Please enter a bill number');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const billAmount = parseFloat(formData.billAmount || 0);
    console.log('FlashCouponForm - Bill amount entered:', billAmount); // Debug log
    
    // Check if bill amount is greater than 10000
    if (billAmount > 10000) {
      console.log('FlashCouponForm - Amount > 10000, showing modal...'); // Debug log
      setPendingFormData(formData);
      setShowAmountConfirmModal(true);
      return; // Don't proceed with generation yet
    }

    console.log('FlashCouponForm - Amount <= 10000, proceeding normally...'); // Debug log
    proceedWithCouponGeneration(formData);
  };

  const proceedWithCouponGeneration = async (submitFormData) => {
    setLoading(true);
    try {
      const res = await entityAPI.generateCoupon(submitFormData);
      
      if (res?.coupon_code === 'not_elig') {
        toast.error("Not eligible for the coupon");
        return;
      }

      const couponId = res?.coupon_id || res?.couponCode || res?.coupon_code || res?.id || '';
      const copies = Number(res?.coupons_given) > 0 ? Number(res.coupons_given) : 1;
      
      toast.success('Coupon generated successfully');
      if (couponId) toast.success(`Coupon: ${couponId}`);

      // Call print service
      await fetch("http://localhost:8081/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: "G Mart Gadams",
          copies: copies,
          coupon_name: res?.name,
          coupon_mobile: res?.mobile,
          coupon_couponcode: couponId
        })
      });

      toast.success(`Printed ${copies} coupon${copies > 1 ? 's' : ''}`);

      // Reset form
      resetForm();

      if (onCouponGenerated) {
        onCouponGenerated({ ...res, couponId, copies });
      }

    } catch (err) {
      toast.error('Failed to generate coupon');
      console.error(err);
    } finally {
      setLoading(false);
      setPendingFormData(null);
      loadCouponCount();
    }
  };

  const handleAmountConfirmation = () => {
    console.log('FlashCouponForm - Amount confirmed, proceeding...'); // Debug log
    if (pendingFormData) {
      proceedWithCouponGeneration(pendingFormData);
    }
    setShowAmountConfirmModal(false);
    setPendingFormData(null);
  };

  const handleAmountCancellation = () => {
    console.log('FlashCouponForm - Amount confirmation cancelled'); // Debug log
    setShowAmountConfirmModal(false);
    setPendingFormData(null);
    toast.info('Coupon generation cancelled. Please verify the bill amount.');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      billAmount: '',
      billNumber: '',
      mobileNo: '',
      village: '',
      excludeAmt: '0'
    });
    setShowFlashModal(false);
    setCurrentField(null);
    setFieldValue('');
  };

  const getCompletedFieldsCount = () => {
    return flashSteps.filter(step => {
      const value = formData[step.name];
      if (step.required) {
        return value && value.toString().trim() !== '' && value !== '0';
      }
      return value && value.toString().trim() !== '' && value !== '0';
    }).length;
  };

  const isFormReady = () => {
    return formData.mobileNo && formData.mobileNo.length === 10 && 
           formData.billAmount && parseFloat(formData.billAmount) > 0 && 
           formData.billNumber && formData.billNumber.trim() !== '';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Form Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-red-600 via-orange-600 to-orange-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Flash Coupon Generation</h2>
              <p className="text-purple-100 mt-0.5 text-sm">
                Lightning-fast coupon generation with individual flash modals
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Start Flash Entry Button */}
          <div className="text-center mb-8">
            <button
              onClick={startFlashForm}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 transition-all flex items-center gap-3 mx-auto font-semibold text-lg shadow-lg"
            >
              <SparklesIcon className="w-6 h-6" />
              Start Flash Entry
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form Progress */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TicketIcon className="w-5 h-5" />
              Entry Progress ({getCompletedFieldsCount()}/{flashSteps.length})
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {flashSteps.map((step, index) => {
                const value = formData[step.name];
                const isComplete = value && value.toString().trim() !== '' && value !== '0';
                return (
                  <div
                    key={step.name}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer group hover:shadow-md ${
                      isComplete 
                        ? 'border-green-200 bg-green-50 hover:border-green-300' 
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                    onClick={() => editField(index)}
                    title={`Click to ${isComplete ? 'edit' : 'fill'} ${step.label}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{step.icon}</span>
                        <span className={`text-sm font-medium ${
                          isComplete ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          {step.label}
                          {step.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                        {isComplete && <CheckIcon className="w-4 h-4 text-green-500" />}
                      </div>
                      <PencilIcon className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isComplete ? 'text-green-500' : 'text-purple-500'
                      }`} />
                    </div>
                    <div className={`text-sm ${
                      isComplete ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {isComplete ? (
                        step.name === 'mobileNo' ? `+91 ${value}` : value
                      ) : 'Not set'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Generate Button */}
            {isFormReady() && (
              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating Coupon...
                    </>
                  ) : (
                    <>
                      <TicketIcon className="w-5 h-5" />
                      Generate Coupon
                    </>
                  )}
                </button>
                
                <button
                  onClick={resetForm}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
              </div>
            )}

            {/* Coupon Count */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 text-center">
                  Total coupons issued to date: <span className="text-purple-600 font-bold">{couponCount}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flash Modal */}
      {showFlashModal && currentField !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{flashSteps[currentField].icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{flashSteps[currentField].label}</h3>
                    <p className="text-purple-100 text-sm">
                      Step {currentField + 1} of {flashSteps.length}
                      {flashSteps[currentField].required && <span className="text-yellow-200 ml-1">*</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFlashModal(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                {flashSteps[currentField].description}
              </p>
              
              {flashSteps[currentField].type === 'autocomplete' ? (
                <VillageAutocomplete
                  value={fieldValue}
                  onChange={handleFieldChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleFlashNext();
                    }
                  }}
                  placeholder={flashSteps[currentField].placeholder}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-center"
                  autoFocus
                />
              ) : (
                <input
                  type={flashSteps[currentField].type}
                  value={fieldValue}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleFlashNext();
                    }
                  }}
                  placeholder={flashSteps[currentField].placeholder}
                  min={flashSteps[currentField].min}
                  step={flashSteps[currentField].step}
                  maxLength={flashSteps[currentField].maxLength}
                  pattern={flashSteps[currentField].pattern}
                  inputMode={flashSteps[currentField].name === 'mobileNo' ? 'numeric' : undefined}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-center"
                  autoFocus
                />
              )}

              {/* Progress bar */}
              <div className="mt-6 mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(((currentField + 1) / flashSteps.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentField + 1) / flashSteps.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3">
                {currentField > 0 && (
                  <button
                    onClick={handleFlashBack}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleFlashNext}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 transition-all flex items-center justify-center gap-2 font-medium"
                >
                  {currentField < flashSteps.length - 1 ? 'Next' : 'Finish'}
                  {currentField < flashSteps.length - 1 && <ArrowRightIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Amount Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAmountConfirmModal}
        onClose={handleAmountCancellation}
        onConfirm={handleAmountConfirmation}
        title={t("coupon.highAmountAlert")}
        message={t("coupon.highAmountMessage", {
          billAmount: pendingFormData?.billAmount ? parseFloat(pendingFormData.billAmount).toLocaleString('en-IN') : '0',
          couponCount: pendingFormData?.billAmount ? Math.floor(parseFloat(pendingFormData.billAmount) / 1000) : 0
        })}
        type="warning"
        confirmText="Yes, Generate Coupons"
        cancelText="No, Let me Check"
        showCloseButton={true}
      />
    </div>
  );
};

export default FlashCouponForm;