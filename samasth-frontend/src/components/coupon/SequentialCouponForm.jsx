import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { entityAPI } from '../../services/api';
import VillageAutocomplete from '../VillageAutocomplete';
import ConfirmationModal from '../common/ConfirmationModal';
import { 
  TicketIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  DocumentTextIcon,
  UserIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const SequentialCouponForm = ({ onCouponGenerated }) => {
  const [formData, setFormData] = useState({
    name: '',
    billAmount: '',
    billNumber: '',
    mobileNo: '',
    village: '',
    excludeAmt: '0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCount, setCouponCount] = useState(0);
  
  // Confirmation modal states
  const [showAmountConfirmModal, setShowAmountConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeNumeric = (e) => {
    let input = e.target.value.replace(/\D/g, ""); // digits only
    if (input.length > 10) input = input.slice(0, 10); // limit to 10 digits
    setFormData(prev => ({ ...prev, [e.target.name]: input }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.billAmount || !formData.billNumber || !formData.mobileNo) {
      toast.error('Please fill in all required fields');
      return;
    }

    const billAmount = parseFloat(formData.billAmount || 0);
    console.log('SequentialCouponForm - Bill amount entered:', billAmount); // Debug log
    
    // Check if bill amount is greater than 10000
    if (billAmount > 10000) {
      console.log('SequentialCouponForm - Amount > 10000, showing modal...'); // Debug log
      setPendingFormData(formData);
      setShowAmountConfirmModal(true);
      return; // Don't proceed with generation yet
    }

    console.log('SequentialCouponForm - Amount <= 10000, proceeding normally...'); // Debug log
    proceedWithCouponGeneration(formData);
  };

  const proceedWithCouponGeneration = async (submitFormData) => {
    setIsSubmitting(true);
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

      try{
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
    }
    catch (err) {
      toast.error('Failed to print coupon');
      console.error(err);
    } 

      // Reset form
      setFormData({
        name: '',
        billAmount: '',
        billNumber: '',
        mobileNo: '',
        village: '',
        excludeAmt: '0'
      });

      if (onCouponGenerated) {
        onCouponGenerated({ ...res, couponId, copies });
      }

    } catch (err) {
      toast.error('Failed to generate coupon');
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setPendingFormData(null);
      loadCouponCount();
    }
  };

  const handleAmountConfirmation = () => {
    console.log('SequentialCouponForm - Amount confirmed, proceeding...'); // Debug log
    if (pendingFormData) {
      proceedWithCouponGeneration(pendingFormData);
    }
    setShowAmountConfirmModal(false);
    setPendingFormData(null);
  };

  const handleAmountCancellation = () => {
    console.log('SequentialCouponForm - Amount confirmation cancelled'); // Debug log
    setShowAmountConfirmModal(false);
    setPendingFormData(null);
    toast.info('Coupon generation cancelled. Please verify the bill amount.');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Generate Coupon</h2>
              <p className="text-orange-100 mt-0.5 text-sm">
                Traditional step-by-step coupon generation
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mobile Number */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <DevicePhoneMobileIcon className="w-4 h-4" />
                Mobile Number *
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                name="mobileNo"
                value={formData.mobileNo}
                onChange={handleChangeNumeric}
                autoComplete="off"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="Enter 10-digit mobile number"
                required
              />
            </div>

            {/* Bill Amount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <BanknotesIcon className="w-4 h-4" />
                Bill Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="billAmount"
                value={formData.billAmount}
                onChange={handleChange}
                autoComplete="off"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="Enter bill amount"
                required
              />
            </div>

            {/* Exclude Amount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <BanknotesIcon className="w-4 h-4" />
                Exclude Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="excludeAmt"
                value={formData.excludeAmt}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                autoComplete="off"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="Amount to exclude (default: 0)"
              />
            </div>

            {/* Bill Number */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <DocumentTextIcon className="w-4 h-4" />
                Bill Number *
              </label>
              <input
                type="text"
                name="billNumber"
                value={formData.billNumber}
                onChange={handleChange}
                autoComplete="off"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="Enter bill/invoice number"
                required
              />
            </div>

            {/* Customer Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <UserIcon className="w-4 h-4" />
                Customer Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="off"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="Enter customer name (optional)"
              />
            </div>

            {/* Village */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <MapPinIcon className="w-4 h-4" />
                Village
              </label>
              <VillageAutocomplete
                value={formData.village}
                onChange={(value) => setFormData(prev => ({ ...prev, village: value }))}
                placeholder="Start typing village name..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !formData.billAmount || !formData.billNumber || !formData.mobileNo}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg flex items-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating Coupon...
                  </>
                ) : (
                  <>
                    <TicketIcon className="w-5 h-5" />
                    Generate Coupon
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Coupon Count */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 text-center">
                Total coupons issued to date: <span className="text-orange-600 font-bold">{couponCount}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAmountConfirmModal}
        onClose={handleAmountCancellation}
        onConfirm={handleAmountConfirmation}
        title="High Bill Amount Alert"
        message={`You entered a bill amount of ₹${pendingFormData?.billAmount ? parseFloat(pendingFormData.billAmount).toLocaleString('en-IN') : '0'}. This is a large amount and will generate ${pendingFormData?.billAmount ? Math.floor(parseFloat(pendingFormData.billAmount) / 1000) : 0} coupons. Please confirm this is the intended amount.`}
        type="warning"
        confirmText="Yes, Generate Coupons"
        cancelText="No, Let me Check"
        showCloseButton={true}
      />
    </div>
  );
};

export default SequentialCouponForm;