import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Trash2,
  CreditCard,
  X,
  Package,
  Receipt,
  IndianRupee,
  Monitor,
  ShoppingCart,
  Plus,
  Minus,
  Banknote,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
} from 'lucide-react';
import { stockAPI } from '../services/api';

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: 'bg-gray-950',
    header: 'bg-gray-900 border-gray-800',
    card: 'bg-gray-900 border-gray-800',
    input: 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500/30',
    dropdown: 'bg-gray-800 border-gray-700',
    dropdownHover: 'hover:bg-gray-700',
    dropdownBorder: 'border-gray-700/50',
    row: 'bg-gray-900 border-gray-800 hover:border-gray-700',
    text: 'text-white',
    subtext: 'text-gray-400',
    muted: 'text-gray-500',
    rightPanel: 'bg-gray-900 border-gray-800',
    summaryBox: 'bg-gray-800/60',
    actionBtn: 'bg-gray-800 hover:bg-gray-700 border-gray-700',
    qtyBtn: 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300',
    modal: 'bg-gray-900 border-gray-800',
    modalInput: 'bg-gray-800 border-gray-700 text-white focus:border-emerald-500 focus:ring-emerald-500/30',
    modeBtn: 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white',
    modeBtnActive: 'bg-emerald-600/20 border-emerald-500 text-emerald-400',
    cashBox: 'bg-gray-800',
    denomBox: 'bg-gray-800/60',
    denomText: 'text-gray-300',
    denomSubtext: 'text-gray-400',
    upiNote: 'bg-gray-800 border-gray-700 text-gray-500',
    toggleBg: 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white',
  },
  light: {
    bg: 'bg-gray-50',
    header: 'bg-white border-gray-200',
    card: 'bg-white border-gray-200',
    input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500/30',
    dropdown: 'bg-white border-gray-200',
    dropdownHover: 'hover:bg-gray-50',
    dropdownBorder: 'border-gray-100',
    row: 'bg-white border-gray-200 hover:border-gray-300',
    text: 'text-gray-900',
    subtext: 'text-gray-500',
    muted: 'text-gray-400',
    rightPanel: 'bg-white border-gray-200',
    summaryBox: 'bg-gray-50',
    actionBtn: 'bg-gray-100 hover:bg-gray-200 border-gray-200',
    qtyBtn: 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700',
    modal: 'bg-white border-gray-200',
    modalInput: 'bg-gray-50 border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/30',
    modeBtn: 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900',
    modeBtnActive: 'bg-emerald-50 border-emerald-500 text-emerald-700',
    cashBox: 'bg-gray-50',
    denomBox: 'bg-gray-50',
    denomText: 'text-gray-700',
    denomSubtext: 'text-gray-500',
    upiNote: 'bg-gray-50 border-gray-200 text-gray-400',
    toggleBg: 'bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900',
  },
};

// ─── BroadcastChannel helper ────────────────────────────────────────────────
const CHANNEL_NAME = 'samasth_sale_channel';
let saleChannel = null;
const getChannel = () => {
  if (!saleChannel) saleChannel = new BroadcastChannel(CHANNEL_NAME);
  return saleChannel;
};

// ─── Denomination helper ─────────────────────────────────────────────────────
const DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1];
const calcDenominations = (amount) => {
  let remaining = Math.round(amount);
  const breakdown = [];
  for (const d of DENOMINATIONS) {
    const count = Math.floor(remaining / d);
    if (count > 0) {
      breakdown.push({ denomination: d, count });
      remaining -= d * count;
    }
  }
  return breakdown;
};

// ─── Main SalePage ───────────────────────────────────────────────────────────
const SalePage = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('pos_theme') || 'dark');
  const T = THEMES[theme];
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('pos_theme', next);
  };

  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [customerDisplayOpen, setCustomerDisplayOpen] = useState(false);
  const [customerUpiConsent, setCustomerUpiConsent] = useState(null); // { phone: '...' } | null
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'card' | 'upi'
  const [cashTendered, setCashTendered] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [upiSent, setUpiSent] = useState(false);
  const [saleMessage, setSaleMessage] = useState('');

  const inputRef = useRef(null);
  const searchDebounce = useRef(null);
  const customerDisplayRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Calculate totals
  useEffect(() => {
    const amt = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const qty = cartItems.reduce((s, i) => s + i.quantity, 0);
    setTotalAmount(amt);
    setTotalQuantity(qty);
  }, [cartItems]);

  // Broadcast cart updates to customer display
  useEffect(() => {
    if (customerDisplayOpen) {
      getChannel().postMessage({
        type: 'CART_UPDATE',
        cart: cartItems,
        total: totalAmount,
        quantity: totalQuantity,
      });
    }
  }, [cartItems, totalAmount, totalQuantity, customerDisplayOpen]);

  // Listen for UPI consent from customer display
  useEffect(() => {
    const ch = getChannel();
    const handler = (evt) => {
      if (evt.data?.type === 'UPI_CONSENT') {
        setCustomerUpiConsent({ phone: evt.data.phone });
        setSaleMessage(`Customer accepted UPI change → ${evt.data.phone}`);
      }
    };
    ch.addEventListener('message', handler);
    return () => ch.removeEventListener('message', handler);
  }, []);

  // ── Search ──────────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    if (val.trim().length >= 1) {
      setSearchLoading(true);
      setShowDropdown(true);
      searchDebounce.current = setTimeout(async () => {
        try {
          const data = await stockAPI.getStockForSale(val.trim());
          // Support different response shapes
          const results = Array.isArray(data)
            ? data
            : data?.results || data?.stocks || [];
          setSearchResults(results.slice(0, 10));
        } catch {
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 250);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
      setSearchLoading(false);
    }
  };

  // ── Add item from search dropdown ───────────────────────────────────────────
  const addItemFromSearch = useCallback((entity) => {
    const price =
      entity.sale_price ||
      entity.s_sale_value ||
      entity.e_sale_price ||
      entity.price ||
      0;
    const code = entity.e_barcode || entity.id || entity.e_id || entity.code || String(Math.random());
    const name = entity.e_name || entity.name || 'Unknown Item';

    setCartItems((prev) => {
      const existing = prev.findIndex((i) => i.code === code);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + 1 };
        return updated;
      }
      return [...prev, { code, name, price: parseFloat(price) || 0, quantity: 1, entity }];
    });
    setInputValue('');
    setShowDropdown(false);
    setSearchResults([]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // ── Barcode scan (Enter key) ────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const barcode = inputValue.trim();
      if (!barcode) return;

      // Exact barcode match from search results
      const exactMatch = searchResults.find(
        (r) =>
          (r.e_barcode && r.e_barcode === barcode) ||
          (r.barcode && r.barcode === barcode) ||
          (r.code && r.code === barcode)
      );

      if (exactMatch) {
        addItemFromSearch(exactMatch);
        return;
      }

      // If only one result, add it
      if (searchResults.length === 1) {
        addItemFromSearch(searchResults[0]);
        return;
      }

      // Try fetching by barcode query
      if (searchResults.length === 0 && barcode.length > 0) {
        setInputValue('');
        setShowDropdown(false);
        inputRef.current?.focus();
      }
    }

    if (e.key === 'Escape') {
      setShowDropdown(false);
      setInputValue('');
    }
  };

  // ── Cart management ─────────────────────────────────────────────────────────
  const updateQuantity = (code, delta) => {
    setCartItems((prev) => {
      const updated = prev
        .map((i) => (i.code === code ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0);
      return updated;
    });
  };

  const removeItem = (code) => {
    setCartItems((prev) => prev.filter((i) => i.code !== code));
  };

  const clearCart = () => {
    setCartItems([]);
    setCustomerUpiConsent(null);
    setSaleMessage('');
    inputRef.current?.focus();
  };

  // ── Open customer display ───────────────────────────────────────────────────
  const openCustomerDisplay = () => {
    const w = window.open('/customer-display', 'CustomerDisplay', 'width=1280,height=800');
    customerDisplayRef.current = w;
    setCustomerDisplayOpen(true);
    // Send initial cart state
    setTimeout(() => {
      getChannel().postMessage({
        type: 'CART_UPDATE',
        cart: cartItems,
        total: totalAmount,
        quantity: totalQuantity,
      });
    }, 800);
  };

  // ── Payment ─────────────────────────────────────────────────────────────────
  const cashTenderedNum = parseFloat(cashTendered) || 0;
  const changeAmount = Math.max(0, cashTenderedNum - totalAmount);
  const denominationBreakdown = cashTendered ? calcDenominations(changeAmount) : [];

  const processPayment = () => {
    if (cartItems.length === 0) return;

    if (paymentMode === 'cash') {
      if (cashTenderedNum < totalAmount) return; // not enough cash

      // If customer opted for UPI change
      if (customerUpiConsent && changeAmount > 0) {
        setUpiSent(true);
        getChannel().postMessage({
          type: 'UPI_CHANGE_SENT',
          phone: customerUpiConsent.phone,
          amount: changeAmount,
        });
      }
    }

    setPaymentComplete(true);

    setTimeout(() => {
      getChannel().postMessage({ type: 'SALE_COMPLETE' });
      clearCart();
      setShowPaymentModal(false);
      setPaymentComplete(false);
      setUpiSent(false);
      setCashTendered('');
      setPaymentMode('cash');
      inputRef.current?.focus();
    }, 2000);
  };

  const openPaymentModal = () => {
    if (cartItems.length === 0) return;
    setPaymentComplete(false);
    setUpiSent(false);
    setCashTendered('');
    setShowPaymentModal(true);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={`w-full h-full flex flex-col ${T.bg} ${T.text}`}>
      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-6 py-4 border-b shadow-sm ${T.header}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-lg font-bold leading-tight ${T.text}`}>Sales Point</h1>
            <p className={`text-xs ${T.subtext}`}>Scan or search items to begin</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saleMessage && (
            <div className="flex items-center gap-2 bg-emerald-900/60 text-emerald-300 text-xs px-3 py-1.5 rounded-lg border border-emerald-700">
              <CheckCircle className="w-3.5 h-3.5" />
              {saleMessage}
            </div>
          )}
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${T.toggleBg}`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={openCustomerDisplay}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Monitor className="w-4 h-4" />
            {customerDisplayOpen ? 'Display Opened' : 'New Sale (Open Display)'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Left: scan + cart ── */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Scan input */}
          <div className={`px-6 py-4 border-b ${T.header}`}>
            <div className="relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${T.subtext}`} />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Scan barcode or type to search…"
                autoFocus
                className={`w-full pl-12 pr-4 py-4 border rounded-xl text-lg focus:outline-none focus:ring-2 transition-all ${T.input}`}
              />
              {searchLoading && (
                <Loader2 className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin ${T.subtext}`} />
              )}

              {/* Dropdown */}
              {showDropdown && (searchResults.length > 0 || searchLoading) && (
                <div className={`absolute left-0 right-0 top-full mt-1 border rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto ${T.dropdown}`}>
                  {searchLoading && searchResults.length === 0 ? (
                    <div className={`px-4 py-3 text-sm flex items-center gap-2 ${T.subtext}`}>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching…
                    </div>
                  ) : (
                    searchResults.map((entity, idx) => {
                      const price =
                        entity.sale_price ||
                        entity.s_sale_value ||
                        entity.e_sale_price ||
                        entity.price ||
                        0;
                      const name = entity.e_name || entity.name || 'Unknown';
                      const barcode = entity.e_barcode || entity.barcode || '';
                      return (
                        <button
                          key={entity.id || entity.e_id || idx}
                          onMouseDown={() => addItemFromSearch(entity)}
                          className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left border-b last:border-0 ${T.dropdownHover} ${T.dropdownBorder}`}
                        >
                          <div>
                            <div className={`text-sm font-medium ${T.text}`}>{name}</div>
                            {barcode && (
                              <div className={`text-xs ${T.subtext}`}>Barcode: {barcode}</div>
                            )}
                          </div>
                          {price > 0 && (
                            <div className="text-emerald-400 text-sm font-semibold ml-4">
                              ₹{parseFloat(price).toFixed(2)}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cart table */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cartItems.length === 0 ? (
              <div className={`flex flex-col items-center justify-center h-64 gap-3 ${T.muted}`}>
                <Package className="w-16 h-16" />
                <p className="text-lg font-medium">Cart is empty</p>
                <p className="text-sm">Scan a barcode or search above to add items</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div
                    key={item.code}
                    className={`flex items-center border rounded-xl px-4 py-3 gap-4 group transition-colors ${T.row}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate ${T.text}`}>{item.name}</div>
                      <div className={`text-xs mt-0.5 ${T.muted}`}>Code: {item.code}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.code, -1)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${T.qtyBtn}`}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className={`w-10 text-center text-sm font-semibold ${T.text}`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.code, 1)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${T.qtyBtn}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className={`text-sm w-24 text-right ${T.subtext}`}>
                      ₹{item.price.toFixed(2)} × {item.quantity}
                    </div>

                    <div className="text-emerald-400 font-bold text-sm w-24 text-right">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </div>

                    <button
                      onClick={() => removeItem(item.code)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-400 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Order summary ── */}
        <div className={`w-72 flex flex-col border-l ${T.rightPanel}`}>
          <div className={`px-6 pt-6 pb-4 border-b ${T.header}`}>
            <h2 className={`text-sm font-semibold uppercase tracking-widest ${T.subtext}`}>
              Order Summary
            </h2>
          </div>

          <div className="flex-1 px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className={`flex items-center gap-2 ${T.subtext}`}>
                <Package className="w-4 h-4" />
                Items
              </span>
              <span className={`font-semibold ${T.text}`}>{totalQuantity}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className={`flex items-center gap-2 ${T.subtext}`}>
                <Receipt className="w-4 h-4" />
                Lines
              </span>
              <span className={`font-semibold ${T.text}`}>{cartItems.length}</span>
            </div>
            {customerUpiConsent && (
              <div className="flex items-start gap-2 bg-indigo-900/40 border border-indigo-700 rounded-lg px-3 py-2.5 text-xs">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-indigo-300 font-medium">UPI change consent</div>
                  <div className="text-indigo-400 mt-0.5">{customerUpiConsent.phone}</div>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 space-y-3">
            <div className={`rounded-xl px-4 py-3 ${T.summaryBox}`}>
              <div className={`text-xs mb-1 ${T.muted}`}>Total Amount</div>
              <div className="text-3xl font-bold text-emerald-400 flex items-center gap-1">
                <IndianRupee className="w-5 h-5" />
                {totalAmount.toFixed(2)}
              </div>
            </div>

            <button
              onClick={openPaymentModal}
              disabled={cartItems.length === 0}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Pay ₹{totalAmount.toFixed(2)}
            </button>

            <button
              onClick={clearCart}
              disabled={cartItems.length === 0}
              className={`w-full py-2.5 disabled:opacity-40 disabled:cursor-not-allowed text-red-500 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-colors border ${T.actionBtn}`}
            >
              <Trash2 className="w-4 h-4" />
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      {/* ──────────────────────── PAYMENT MODAL ──────────────────────── */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ${T.modal}`}>
            {/* Modal header */}
            <div className={`flex items-center justify-between px-6 py-5 border-b ${T.header}`}>
              <h2 className={`text-lg font-bold ${T.text}`}>Payment</h2>
              {!paymentComplete && (
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {paymentComplete ? (
              /* ── Success state ── */
              <div className="px-6 py-10 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-600/20 flex items-center justify-center">
                  <CheckCircle className="w-9 h-9 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Payment Complete!</h3>
                {upiSent && customerUpiConsent && (
                  <div className="flex items-center gap-2 text-indigo-300 text-sm bg-indigo-900/40 border border-indigo-700 rounded-lg px-4 py-2.5">
                    <Smartphone className="w-4 h-4 shrink-0" />
                    Change of ₹{changeAmount.toFixed(2)} sent to {customerUpiConsent.phone} via UPI
                  </div>
                )}
                <p className="text-gray-400 text-sm">Resetting cart…</p>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-5">
                {/* Amount due */}
                <div className="bg-gray-800 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Amount Due</span>
                  <span className="text-2xl font-bold text-emerald-400">₹{totalAmount.toFixed(2)}</span>
                </div>

                {/* Payment mode tabs */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Payment Mode</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: 'Cash', icon: Banknote },
                      { id: 'card', label: 'Card', icon: CreditCard },
                      { id: 'upi', label: 'UPI', icon: Smartphone },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setPaymentMode(id)}
                        className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-all ${paymentMode === id ? T.modeBtnActive : T.modeBtn
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash panel */}
                {paymentMode === 'cash' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1.5">
                        Cash Tendered (₹)
                      </label>
                      <div className="relative">
                        <IndianRupee className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${T.subtext}`} />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          placeholder="0.00"
                          className={`w-full pl-9 pr-4 py-3 border rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 ${T.modalInput}`}
                          autoFocus
                        />
                      </div>
                    </div>

                    {cashTenderedNum > 0 && (
                      <div className="space-y-2">
                        {cashTenderedNum < totalAmount ? (
                          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            Insufficient amount — ₹{(totalAmount - cashTenderedNum).toFixed(2)} short
                          </div>
                        ) : (
                          <>
                            <div className={`flex justify-between items-center rounded-xl px-4 py-3 ${T.cashBox}`}>
                              <span className={`text-sm ${T.subtext}`}>Change Due</span>
                              <span className="text-xl font-bold text-yellow-400">
                                ₹{changeAmount.toFixed(2)}
                              </span>
                            </div>

                            {changeAmount > 0 && (
                              <>
                                {/* Denomination breakdown */}
                                <div className={`rounded-xl px-4 py-3 ${T.denomBox}`}>
                                  <p className={`text-xs mb-2 uppercase tracking-widest ${T.muted}`}>
                                    Change Breakdown
                                  </p>
                                  <div className="space-y-1">
                                    {denominationBreakdown.map(({ denomination, count }) => (
                                      <div
                                        key={denomination}
                                        className="flex justify-between text-sm"
                                      >
                                        <span className={T.denomText}>
                                          ₹{denomination} × {count}
                                        </span>
                                        <span className={T.denomSubtext}>
                                          ₹{(denomination * count).toFixed(0)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* UPI change option */}
                                {customerUpiConsent ? (
                                  <div className="flex items-center gap-2 text-indigo-300 text-sm bg-indigo-900/30 border border-indigo-700 rounded-lg px-3 py-2.5">
                                    <Smartphone className="w-4 h-4 shrink-0" />
                                    Change will be sent to {customerUpiConsent.phone} via UPI
                                  </div>
                                ) : (
                                  <div className={`flex items-center gap-2 text-xs border rounded-lg px-3 py-2.5 ${T.upiNote}`}>
                                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                                    Customer display: customer can opt for UPI change
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Card panel */}
                {paymentMode === 'card' && (
                  <div className={`rounded-xl px-4 py-4 text-center text-sm ${T.subtext} ${T.cashBox}`}>
                    <CreditCard className={`w-8 h-8 mx-auto mb-2 ${T.muted}`} />
                    Swipe / tap card on the terminal, then click <strong className="text-white">Complete Payment</strong>.
                  </div>
                )}

                {/* UPI panel */}
                {paymentMode === 'upi' && (
                  <div className={`rounded-xl px-4 py-4 text-center text-sm ${T.subtext} ${T.cashBox}`}>
                    <Smartphone className={`w-8 h-8 mx-auto mb-2 ${T.muted}`} />
                    Share QR / UPI ID with customer, then click <strong className="text-white">Complete Payment</strong>.
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={processPayment}
                  disabled={
                    paymentMode === 'cash' &&
                    (cashTenderedNum < totalAmount || !cashTendered)
                  }
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Complete Payment
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalePage;
