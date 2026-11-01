import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  CheckCircle,
  ShoppingBag,
  IndianRupee,
  Package,
  Send,
} from 'lucide-react';

const CHANNEL_NAME = 'samasth_sale_channel';

const CustomerDisplayPage = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [saleComplete, setSaleComplete] = useState(false);
  const [upiConsentSent, setUpiConsentSent] = useState(false);
  const [upiChangeSent, setUpiChangeSent] = useState(null); // { phone, amount }
  const [phone, setPhone] = useState('');
  const [phoneSubmitted, setPhoneSubmitted] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const channelRef = useRef(null);

  useEffect(() => {
    channelRef.current = new BroadcastChannel(CHANNEL_NAME);

    channelRef.current.addEventListener('message', (evt) => {
      const { type } = evt.data;

      if (type === 'CART_UPDATE') {
        setCart(evt.data.cart || []);
        setTotal(evt.data.total || 0);
        setQuantity(evt.data.quantity || 0);
        setSaleComplete(false);
      }

      if (type === 'SALE_COMPLETE') {
        setSaleComplete(true);
        // Reset after 6 seconds
        setTimeout(() => {
          setSaleComplete(false);
          setCart([]);
          setTotal(0);
          setQuantity(0);
          setUpiConsentSent(false);
          setPhoneSubmitted(false);
          setPhone('');
          setUpiChangeSent(null);
        }, 6000);
      }

      if (type === 'UPI_CHANGE_SENT') {
        setUpiChangeSent({ phone: evt.data.phone, amount: evt.data.amount });
      }
    });

    return () => {
      channelRef.current?.close();
    };
  }, []);

  const handleConsentSubmit = (e) => {
    e.preventDefault();
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setPhoneError('');
    setPhoneSubmitted(true);
    setUpiConsentSent(true);
    channelRef.current?.postMessage({ type: 'UPI_CONSENT', phone: cleaned });
  };

  // ── Sale Complete Screen ────────────────────────────────────────────────────
  if (saleComplete) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 text-white">
        <div className="w-24 h-24 rounded-full bg-emerald-600/20 flex items-center justify-center animate-bounce">
          <CheckCircle className="w-14 h-14 text-emerald-400" />
        </div>
        <h1 className="text-5xl font-extrabold text-white">Thank You!</h1>
        <p className="text-xl text-gray-400">Please visit us again.</p>
        {upiChangeSent && (
          <div className="flex items-center gap-3 bg-indigo-900/40 border border-indigo-700 text-indigo-300 rounded-2xl px-6 py-4 text-lg">
            <Smartphone className="w-6 h-6 shrink-0" />
            ₹{upiChangeSent.amount.toFixed(2)} change sent to {upiChangeSent.phone} via UPI
          </div>
        )}
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-gray-600">
        <ShoppingBag className="w-20 h-20" />
        <h1 className="text-2xl font-bold text-gray-500">Waiting for sale…</h1>
        <p className="text-sm text-gray-600">Items will appear here as they are scanned.</p>
      </div>
    );
  }

  // ── Active sale screen ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Your Purchase</h1>
            <p className="text-xs text-gray-400">Items being scanned will appear here</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Total Items</p>
          <p className="text-2xl font-bold text-white">{quantity}</p>
        </div>
      </div>

      <div className="flex flex-1 gap-0">
        {/* ── Cart list ── */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="space-y-3">
            {cart.map((item, idx) => (
              <div
                key={item.code || idx}
                className="flex items-center bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4 gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-base truncate">{item.name}</div>
                  <div className="text-gray-500 text-sm mt-0.5">
                    ₹{item.price.toFixed(2)} × {item.quantity}
                  </div>
                </div>
                <div className="text-emerald-400 font-bold text-lg shrink-0">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel: total + UPI consent ── */}
        <div className="w-80 border-l border-gray-800 bg-gray-900 flex flex-col p-6 gap-6">
          {/* Total */}
          <div className="bg-gray-800 rounded-2xl px-5 py-5 text-center">
            <p className="text-gray-400 text-sm mb-1">Amount Due</p>
            <p className="text-4xl font-extrabold text-emerald-400 flex items-center justify-center gap-1">
              <IndianRupee className="w-7 h-7" />
              {total.toFixed(2)}
            </p>
          </div>

          {/* UPI consent section */}
          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 flex-1">
            {upiChangeSent ? (
              /* Change sent confirmation */
              <div className="flex flex-col items-center gap-3 text-center h-full justify-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600/20 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-indigo-400" />
                </div>
                <p className="text-indigo-300 font-semibold">UPI Change Sent!</p>
                <p className="text-gray-400 text-sm">
                  ₹{upiChangeSent.amount.toFixed(2)} sent to {upiChangeSent.phone}
                </p>
              </div>
            ) : phoneSubmitted ? (
              /* Consent submitted confirmation */
              <div className="flex flex-col items-center gap-3 text-center h-full justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-emerald-300 font-semibold">Consent Received</p>
                <p className="text-gray-400 text-sm">
                  We'll send any change to <strong className="text-white">{phone}</strong> via UPI.
                </p>
              </div>
            ) : (
              /* Consent form */
              <form onSubmit={handleConsentSubmit} className="flex flex-col gap-4 h-full">
                <div>
                  <p className="text-white font-semibold text-sm leading-relaxed mb-1">
                    💬 UPI Change Option
                  </p>
                  <p className="text-gray-400 text-xs leading-relaxed">
                    If you are planning to pay in cash, can we send your remaining change (if any)
                    to your UPI? If you are okay, please type your phone number below:
                  </p>
                </div>

                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                        setPhoneError('');
                      }}
                      placeholder="10-digit number"
                      className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                      maxLength={10}
                    />
                  </div>
                  {phoneError && (
                    <p className="text-red-400 text-xs mt-1">{phoneError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={phone.length !== 10}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  <Send className="w-4 h-4" />
                  Yes, Send Change to UPI
                </button>

                <p className="text-center text-gray-600 text-xs">
                  Skip if you prefer physical change
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDisplayPage;
