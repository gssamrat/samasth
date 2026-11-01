import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { entityAPI } from '../services/api';
import VillageAutocomplete from './VillageAutocomplete';

const GenerateCoupon = () => {
  const [formData, setFormData] = useState({
    name: '',
    billAmount: '',
    billNumber: '',
    mobileNo: '',
    village: '',
    excludeAmt: '0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangeNumberic = (e) => {
    let input = e.target.value.replace(/\D/g, ""); // digits only
    if (input.length > 10) input = input.slice(0, 10); // limit to 10 digits
    setFormData(prev => ({ ...prev, [e.target.name]: input }));
  };

 
  const [couponCount, setCouponCount] = useState(0);

  // reusable function to fetch coupon count
  const loadCouponCount = async () => {
    try {
      const response = await entityAPI.fetchCouponsCount();
      setCouponCount(response);
    } catch (error) {
      console.error("Error fetching coupon count:", error);
    }
  };

  // call once when component loads
  useEffect(() => {
    loadCouponCount();
  }, []); 


  const handleSubmit = async (e) => {
    e.preventDefault();
    if ( !formData.billAmount || !formData.billNumber || !formData.mobileNo  ) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await entityAPI.generateCoupon(formData);
      if(res?.coupon_code == 'not_elig')
      {
        toast.error("Not eligible for the coupon");
        return;
      }

      const couponId = res?.coupon_id || res?.couponCode || res?.coupon_code || res?.id || '';
      const copies = Number(res?.coupons_given) > 0 ? Number(res.coupons_given) : 1;
      toast.success('Coupon generated successfully');
      if (couponId) toast.success(`Coupon: ${couponId}`);
      await fetch("http://localhost:8081/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shop: "G Mart Gadams",
          copies : copies,
          coupon_name: res?.name, 
          coupon_mobile: res?.mobile, 
          coupon_couponcode: couponId })
        });
      // Print via ESC/POS (WebUSB): print as many copies as coupons_given
      try {
        /*await printEscPosCopies({
          name: formData.name,
          mobileNo: formData.mobileNo,
          village: formData.village,
          couponId,
          copies
        });*/
        toast.success(`Printed ${copies} coupon${copies > 1 ? 's' : ''}`);
      } catch (err) {
        toast.error('Failed to print coupon');
      }
      setFormData({ name: '', billAmount: '', billNumber: '', mobileNo: '', village: '' ,excludeAmt:'0'});
    } catch (err) {
      toast.error('Unexpected error : Failed to generate coupon');
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setFormData({ name: '', billAmount: '', billNumber: '', mobileNo: '', village: '' ,excludeAmt:'0'});
      loadCouponCount();
    }
  };

  const buildCouponEscPos = ({ name, mobileNo, village, couponId }) => {
    if (!('usb' in navigator)) {
      toast.error('WebUSB not supported in this browser');
      return new Uint8Array();
    }

    // Helper to concat Uint8Arrays
    const concat = (chunks) => {
      const total = chunks.reduce((sum, a) => sum + a.length, 0);
      const out = new Uint8Array(total);
      let offset = 0;
      for (const a of chunks) { out.set(a, offset); offset += a.length; }
      return out;
    };

    const te = new TextEncoder();
    const ESC = 0x1B, GS = 0x1D;
    const lf = () => new Uint8Array([0x0A]);
    const esc = (...bytes) => new Uint8Array([ESC, ...bytes]);
    const gs = (...bytes) => new Uint8Array([GS, ...bytes]);
    const text = (s) => te.encode(s);

    // Build receipt
    const chunks = [];
    // Initialize
    chunks.push(esc(0x40)); // ESC @
    // Center, bold title
    chunks.push(esc(0x61, 0x01)); // ESC a 1 (center)
    chunks.push(esc(0x45, 0x01)); // ESC E 1 (bold on)
    chunks.push(text('G Mart Gadams COUPON'));
    chunks.push(lf());
    chunks.push(esc(0x45, 0x00)); // bold off
    chunks.push(text('------------------------------'));
    chunks.push(lf());
    // Left align body
    chunks.push(esc(0x61, 0x00)); // ESC a 0 (left)
    chunks.push(text(`Name: ${name}`));
    chunks.push(lf());
    chunks.push(text(`Mobile: ${mobileNo}`));
    chunks.push(lf());
    chunks.push(text(`Village: ${village}`));
    chunks.push(lf());
    chunks.push(lf());
    chunks.push(text(`Coupon: ${couponId || '-'}`));
    chunks.push(lf());
    chunks.push(lf());
    chunks.push(text('Signature: ___________________________'));
    chunks.push(lf());
    chunks.push(text('Date: ________________________________'));
    chunks.push(lf());
    chunks.push(lf());
    // Thank you centered
    chunks.push(esc(0x61, 0x01));
    chunks.push(text('Thank you!'));
    chunks.push(lf());
    chunks.push(lf());
    // Full cut
    chunks.push(gs(0x56, 0x00)); // GS V 0 (full cut on many models)

    return concat(chunks);
  };

  const printEscPosCopies = async ({ name, mobileNo, village, couponId, copies }) => {
    if (!('usb' in navigator)) {
      throw new Error('WebUSB not supported');
    }
    const data = buildCouponEscPos({ name, mobileNo, village, couponId });
    const device = await navigator.usb.requestDevice({ filters: [] });
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    const iface = device.configuration.interfaces.find(i =>
      i.alternate && i.alternate.endpoints && i.alternate.endpoints.some(ep => ep.direction === 'out')
    ) || device.configuration.interfaces[0];
    await device.claimInterface(iface.interfaceNumber);
    const outEp = iface.alternate.endpoints.find(ep => ep.direction === 'out');
    const endpointNumber = outEp ? outEp.endpointNumber : 1;
    const count = copies && copies > 0 ? copies : 1;
    for (let i = 0; i < count; i += 1) {
      // send one copy
      await device.transferOut(endpointNumber, data);
    }
  };

  return (
    <div className="p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 max-w-2xl">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Generate Coupon</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        
        <div>
            <label className="block text-sm font-semibold text-gray-700">Mobile No</label>
            <input
              type="tel"       
              inputMode="numeric"           // use "tel" instead of "number"        // restricts to digits
              maxLength={10}  
              name="mobileNo"
              value={formData.mobileNo}
              onChange={handleChangeNumberic}
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Bill Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="billAmount"
              value={formData.billAmount}
              onChange={handleChange}
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Exclude Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="excludeAmt"
              value={formData.excludeAmt}
              onChange={handleChange}
              onFocus={(e) => e.target.select()} 
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Bill Number</label>
            <input
              type="text"
              name="billNumber"
              value={formData.billNumber}
              onChange={handleChange}
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Village</label>
            <VillageAutocomplete
              value={formData.village}
              onChange={(value) => setFormData(prev => ({ ...prev, village: value }))}
              placeholder="Start typing village name..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="submit"
              disabled={isSubmitting || !formData.billAmount || !formData.billNumber || !formData.mobileNo}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none shadow-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating...
                </div>
              ) : (
                'Generate Coupon'
              )}
            </button>
          </div>
         
        </form>

        <div>
            <label className="block text-sm font-semibold text-gray-700 text-left">Total Number of coupon issued to-date: {couponCount} </label>
        </div>
        
      </div>


    </div>
  );
};

export default GenerateCoupon;


