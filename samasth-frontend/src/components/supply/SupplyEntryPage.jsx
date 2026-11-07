import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Camera,
  Check,
  Factory,
  Hash,
  Loader2,
  Lock,
  Minus,
  PackagePlus,
  Pencil,
  Plus,
  RotateCcw,
  ScanBarcode,
  Search,
  Truck,
  X,
} from 'lucide-react';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import './SupplyEntryPage.css';

/* -------------------------------------------------------------------------
 * DESIGN PREVIEW: no API wiring yet.
 *
 * DEMO_ITEMS / DEMO_SUPPLIERS / lookupItem() stand in for the real backend so
 * every state of the screen can be reviewed. When wiring up:
 *   - lookupItem(code)  -> GET item by barcode (returns e_id, name,
 *                          manufacturer, HSN, GST %), resolves es_e_id
 *   - DEMO_SUPPLIERS    -> supplier list (es_s_id)
 *   - handleSave()      -> POST the `payload` it already builds, plus an item
 *                          update when `item_update` is present
 * ---------------------------------------------------------------------- */
const DEMO_ITEMS = {
  '8901234567890': {
    eId: 'E1001',
    name: 'Basmati Rice 5 kg',
    barcode: '8901234567890',
    manufacturer: 'Daawat Foods Ltd',
    hsn: '10063020',
    gst: 5,
  },
  '8909876543210': {
    eId: 'E1002',
    name: 'Masala Chai 250 g',
    barcode: '8909876543210',
    manufacturer: 'Tata Consumer Products',
    hsn: '0902',
    gst: 5,
  },
  '8905551234567': {
    eId: 'E1003',
    name: 'Hand Wash Refill 750 ml',
    barcode: '8905551234567',
    manufacturer: 'Hindustan Unilever',
    hsn: '3401',
    gst: 18,
  },
};
const DEMO_MISSING_CODE = '0000000000000';

const DEMO_SUPPLIERS = [
  { id: 'S001', name: 'Sri Lakshmi Traders' },
  { id: 'S002', name: 'Bharat Wholesale Mart' },
  { id: 'S003', name: 'Kaveri Distributors' },
];

const lookupItem = (code) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(DEMO_ITEMS[code] || null), 550);
  });

/* ----------------------------------------------------------------------- */

const GST_PRESETS = [0, 5, 12, 18, 28];
const HSN_PATTERN = /^\d{4}(\d{2}(\d{2})?)?$/;

const EMPTY_SUPPLY = {
  supplierId: '',
  mrp: '',
  purchasePrice: '',
  quantity: '1',
  batchNo: '',
  manufactureDt: '',
  expiryDt: '',
  remarks: '',
};

const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(n);

const toNum = (v) => (v === '' || v == null ? NaN : Number(v));

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

const expiryStatus = (days) => {
  if (days == null) return null;
  if (days < 0) return { tone: 'danger', text: 'Already expired' };
  if (days <= 90) return { tone: 'warn', text: `Expires in ${days} day${days === 1 ? '' : 's'}` };
  return { tone: 'ok', text: `${Math.floor(days / 30)} months shelf life` };
};

/* ------------------------------ small parts ----------------------------- */

function StepTitle({ n, title, subtitle, state }) {
  return (
    <div className="flex items-start gap-3">
      <span className="sp-step-dot" data-state={state}>
        {state === 'done' ? <Check size={15} aria-hidden="true" /> : n}
      </span>
      <div>
        <h2 className="text-base font-semibold leading-tight">{title}</h2>
        {subtitle && <p className="sp-hint mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({ label, htmlFor, hint, error, badge, className = '', children }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <div className="flex min-h-[22px] items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="sp-label">
          {label}
        </label>
        {badge}
      </div>
      {children}
      {error ? (
        <p className="sp-error" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="sp-hint">{hint}</p>
      )}
    </div>
  );
}

/* -------------------------------- page ---------------------------------- */

export default function SupplyEntryPage() {
  const barcodeRef = useRef(null);
  const supplierRef = useRef(null);
  const mrpRef = useRef(null);
  const lookupSeq = useRef(0);

  const [barcode, setBarcode] = useState('');
  const [lookup, setLookup] = useState({ status: 'idle', item: null, code: '' });
  const [hsn, setHsn] = useState('');
  const [gst, setGst] = useState('');
  const [supply, setSupply] = useState(EMPTY_SUPPLY);
  const [log, setLog] = useState([]);

  const item = lookup.item;
  const found = lookup.status === 'found';
  const loading = lookup.status === 'loading';

  /* ---- barcode lookup (scan or key-in) ---- */
  const runLookup = useCallback(async (raw) => {
    const code = (raw || '').trim();
    if (!code) return;
    const seq = ++lookupSeq.current;
    setLookup({ status: 'loading', item: null, code });
    const result = await lookupItem(code);
    if (seq !== lookupSeq.current) return; // a newer scan superseded this one
    if (result) {
      setLookup({ status: 'found', item: result, code });
      setHsn(result.hsn);
      setGst(String(result.gst));
    } else {
      setLookup({ status: 'missing', item: null, code });
    }
  }, []);

  // A hardware scanner works from anywhere on the page, except while the
  // person is typing in some other field.
  useBarcodeScanner({
    onScan: (code) => {
      setBarcode(code);
      runLookup(code);
    },
    shouldIgnore: (e) => {
      const el = e.target;
      return /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName || '') && el.id !== 'sp-barcode';
    },
  });

  // Once an item resolves, drop the cursor on the next thing to fill in.
  useEffect(() => {
    if (found) {
      const next = supply.supplierId ? mrpRef.current : supplierRef.current;
      next?.focus();
    }
    // Only react to a new match, not to every keystroke in the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found, lookup.code]);

  /* ---- derived values ---- */
  const qty = toNum(supply.quantity);
  const mrp = toNum(supply.mrp);
  const pp = toNum(supply.purchasePrice);
  const gstNum = toNum(gst);

  const hsnValid = HSN_PATTERN.test(hsn.trim());
  const gstValid = Number.isFinite(gstNum) && gstNum >= 0 && gstNum <= 100;
  const hsnDirty = found && hsn.trim() !== item.hsn;
  const gstDirty = found && String(gst) !== String(item.gst);

  const pricesOk = mrp > 0 && pp > 0;
  const marginPct = pricesOk ? ((mrp - pp) / mrp) * 100 : null;
  const costTotal = qty > 0 && pp > 0 ? qty * pp : null;
  const mrpTotal = qty > 0 && mrp > 0 ? qty * mrp : null;

  const dateConflict =
    !!supply.manufactureDt && !!supply.expiryDt && supply.expiryDt < supply.manufactureDt;
  const expiry = expiryStatus(daysUntil(supply.expiryDt));

  const checks = [
    { label: 'Item scanned', ok: found },
    { label: 'HSN and GST valid', ok: found && hsnValid && gstValid },
    { label: 'Supplier chosen', ok: !!supply.supplierId },
    { label: 'Quantity, MRP and cost filled', ok: Number.isInteger(qty) && qty > 0 && pricesOk },
    { label: 'Dates make sense', ok: found && !dateConflict },
  ];
  const canSave = checks.every((c) => c.ok);

  const taxStepDone = found && hsnValid && gstValid;
  const supplyStepDone = found && checks.slice(2).every((c) => c.ok);

  /* ---- actions ---- */
  const setField = (key) => (e) => setSupply((s) => ({ ...s, [key]: e.target.value }));

  const bumpQty = (delta) =>
    setSupply((s) => ({
      ...s,
      quantity: String(Math.max(1, (parseInt(s.quantity, 10) || 0) + delta)),
    }));

  const revertTax = () => {
    setHsn(item.hsn);
    setGst(String(item.gst));
  };

  const resetScan = () => {
    lookupSeq.current += 1;
    setBarcode('');
    setLookup({ status: 'idle', item: null, code: '' });
    setHsn('');
    setGst('');
    barcodeRef.current?.focus();
  };

  const clearAll = () => {
    setSupply(EMPTY_SUPPLY);
    resetScan();
  };

  const handleSave = () => {
    if (!canSave) return;
    const asIso = (d) => (d ? `${d}T00:00:00Z` : undefined);
    const payload = {
      e_id: item.eId,
      s_id: supply.supplierId,
      mrp,
      purchase_price: pp,
      stock_quantity: qty,
      remarks: supply.remarks,
      batchno: supply.batchNo || undefined,
      manfacture_dt: asIso(supply.manufactureDt),
      expirydt: asIso(supply.expiryDt),
      // Only present when the person corrected the item's tax details.
      item_update: hsnDirty || gstDirty ? { hsn: hsn.trim(), gst: gstNum } : undefined,
    };
    // TODO(wire): POST `payload` to the backend. Preview only for now.
    console.debug('[SupplyEntry] payload (preview only)', payload);

    setLog((prev) =>
      [{ id: Date.now(), name: item.name, qty, total: qty * pp }, ...prev].slice(0, 5)
    );
    toast.success(`${item.name} × ${qty} recorded`);

    // Rapid-receiving flow: keep the supplier, clear the rest, back to scanning.
    setSupply({ ...EMPTY_SUPPLY, supplierId: supply.supplierId });
    resetScan();
  };

  /* ---- step states ---- */
  const scanState = found ? 'done' : 'active';
  const itemState = !found ? 'idle' : taxStepDone ? 'done' : 'active';
  const supplyState = !found ? 'idle' : supplyStepDone ? 'done' : 'active';

  /* ---- scan status line ---- */
  let status;
  if (loading) {
    status = (
      <p className="sp-hint flex items-center gap-2">
        <Loader2 size={14} className="sp-spin" aria-hidden="true" />
        Looking up <span className="font-mono font-semibold">{lookup.code}</span>…
      </p>
    );
  } else if (found) {
    status = (
      <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-[var(--sp-brand)]">
        <Check size={14} aria-hidden="true" />
        Matched {item.name}
        <button type="button" className="sp-link-btn" onClick={resetScan}>
          Scan a different item
        </button>
      </p>
    );
  } else if (lookup.status === 'missing') {
    status = (
      <p className="flex flex-wrap items-center gap-x-2 text-[0.8125rem] font-medium text-[var(--sp-danger)]">
        <AlertTriangle size={14} aria-hidden="true" />
        No item found for <span className="font-mono">{lookup.code}</span>.
        <Link to="/items" className="sp-link-btn">
          Create it in Entity Management
        </Link>
      </p>
    );
  } else {
    status = (
      <p className="sp-hint flex flex-wrap items-center gap-2">
        Waiting for a scan. Key a code in and press <span className="sp-kbd">Enter</span>
      </p>
    );
  }

  const margin = marginPct == null ? null : marginPct.toFixed(1);
  const marginTone = marginPct == null ? null : marginPct < 0 ? 'danger' : marginPct < 5 ? 'warn' : 'ok';

  /* ---- summary tile (right column on desktop, below the form on mobile) ---- */
  const summary = (
    <div className="sp-tile p-5 sm:p-6">
      <p className="sp-tile-label">Entry summary</p>
      <p className="mt-1 truncate text-base font-medium">
        {found ? item.name : 'No item scanned yet'}
      </p>

      <p className="sp-tile-label mt-5">Value at cost</p>
      <p className="sp-num-xl mt-1">{costTotal == null ? '—' : inr(costTotal)}</p>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="sp-stat">
          <p className="sp-tile-label">Quantity</p>
          <p className="tabular mt-0.5 text-lg font-semibold">
            {Number.isFinite(qty) && qty > 0 ? qty : '—'}
          </p>
        </div>
        <div className="sp-stat">
          <p className="sp-tile-label">Margin</p>
          <p className="tabular mt-0.5 text-lg font-semibold">{margin == null ? '—' : `${margin}%`}</p>
        </div>
        <div className="sp-stat">
          <p className="sp-tile-label">Value at MRP</p>
          <p className="tabular mt-0.5 text-lg font-semibold">
            {mrpTotal == null ? '—' : inr(mrpTotal)}
          </p>
        </div>
        <div className="sp-stat">
          <p className="sp-tile-label">GST</p>
          <p className="tabular mt-0.5 text-lg font-semibold">{gstValid && found ? `${gstNum}%` : '—'}</p>
        </div>
      </div>

      <ul className="mt-5 space-y-2" aria-label="Readiness checklist">
        {checks.map((c) => (
          <li key={c.label} className="sp-check" data-ok={c.ok}>
            <span className="sp-check-dot" aria-hidden="true">
              {c.ok && <Check size={11} strokeWidth={3} />}
            </span>
            {c.label}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-col gap-2.5">
        <button type="button" className="sp-btn sp-btn-mint" disabled={!canSave} onClick={handleSave}>
          <PackagePlus size={17} aria-hidden="true" />
          Save supply entry
        </button>
        <button type="button" className="sp-btn sp-btn-ghost-dark" onClick={clearAll}>
          Clear everything
        </button>
      </div>
    </div>
  );

  return (
    <div className="sp">
      <div className="sp-enter mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-8 sm:pt-8 lg:pb-10">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="sp-eyebrow flex items-center gap-1.5">
              <Truck size={14} aria-hidden="true" />
              Inbound stock
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
              Supply Entry
            </h1>
            <p className="sp-hint mt-1 max-w-xl">
              Scan an item, confirm its tax details, then record what the supplier delivered.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="sp-chip" data-tone="ok">
              <span className="sp-pulse" aria-hidden="true" />
              Scanner ready
            </span>
            <button type="button" className="sp-btn sp-btn-soft" onClick={clearAll}>
              <RotateCcw size={15} aria-hidden="true" />
              New entry
            </button>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ------------------------- main column ------------------------- */}
          <div className="min-w-0 space-y-6">
            {/* Step 1: scan */}
            <section className="sp-card sp-rise p-5 sm:p-6" style={{ '--i': 0 }}>
              <StepTitle
                n={1}
                title="Scan the item"
                subtitle="Use the scanner anywhere on this page, or key the barcode in."
                state={scanState}
              />

              <div className="sp-scan mt-4" data-state={lookup.status}>
                <ScanBarcode
                  size={26}
                  className="shrink-0 text-[var(--sp-brand)]"
                  aria-hidden="true"
                />
                <input
                  id="sp-barcode"
                  ref={barcodeRef}
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Barcode"
                  placeholder="Scan or type barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    // A scanner's Enter is already handled by the page-level hook.
                    if (e.key === 'Enter' && !e.defaultPrevented) {
                      e.preventDefault();
                      runLookup(barcode);
                    }
                  }}
                />
                {barcode && !loading && (
                  <button
                    type="button"
                    className="sp-icon-btn"
                    aria-label="Clear barcode"
                    onClick={resetScan}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  className="sp-icon-btn"
                  title="Scan with camera"
                  aria-label="Scan with camera"
                >
                  <Camera size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="sp-btn sp-btn-primary"
                  disabled={!barcode.trim() || loading}
                  onClick={() => runLookup(barcode)}
                >
                  {loading ? (
                    <Loader2 size={16} className="sp-spin" aria-hidden="true" />
                  ) : (
                    <Search size={16} aria-hidden="true" />
                  )}
                  Find item
                </button>
              </div>

              <div className="mt-3 min-h-[22px]" aria-live="polite">
                {status}
              </div>

              {/* Remove with the demo data. */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-[var(--sp-border)] pt-3">
                <span className="sp-hint">Preview with:</span>
                {[...Object.keys(DEMO_ITEMS), DEMO_MISSING_CODE].map((code) => (
                  <button
                    key={code}
                    type="button"
                    className="sp-chip sp-chip-btn font-mono"
                    onClick={() => {
                      setBarcode(code);
                      runLookup(code);
                    }}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </section>

            {/* Step 2: confirm item */}
            <section className="sp-card sp-rise p-5 sm:p-6" style={{ '--i': 1 }}>
              <StepTitle
                n={2}
                title="Confirm the item"
                subtitle="Manufacturer is fixed. Correct HSN and GST here if they are wrong."
                state={itemState}
              />

              <div className="mt-5">
                {loading && (
                  <div className="space-y-4" aria-hidden="true">
                    <div className="sp-skel h-[68px]" />
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sp-skel h-[66px]" />
                      <div className="sp-skel h-[66px]" />
                      <div className="sp-skel h-[66px]" />
                    </div>
                  </div>
                )}

                {!loading && !found && (
                  <div className="sp-empty">
                    <ScanBarcode size={30} aria-hidden="true" />
                    <p className="text-sm font-medium text-[var(--sp-fg)]">
                      {lookup.status === 'missing' ? 'Nothing matched that barcode' : 'Waiting for a scan'}
                    </p>
                    <p className="sp-hint">
                      The item, its manufacturer, HSN and GST appear here.
                    </p>
                  </div>
                )}

                {found && (
                  <div className="sp-enter">
                    <div className="sp-item-head">
                      <span className="sp-item-badge">
                        <PackagePlus size={20} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold leading-snug">{item.name}</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <span className="sp-chip" title="Item ID (es_e_id)">
                            <Hash size={12} aria-hidden="true" />
                            <span className="font-mono">{item.eId}</span>
                          </span>
                          <span className="sp-chip" title="Barcode">
                            <ScanBarcode size={12} aria-hidden="true" />
                            <span className="font-mono">{item.barcode}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-[1.4fr_1fr_1fr]">
                      <Field
                        label="Manufacturer"
                        htmlFor="sp-mfr"
                        badge={<span className="sp-chip">Read-only</span>}
                      >
                        <div className="sp-affix">
                          <Lock size={14} className="sp-pre" aria-hidden="true" />
                          <input
                            id="sp-mfr"
                            className="sp-input has-pre"
                            value={item.manufacturer}
                            readOnly
                            tabIndex={-1}
                          />
                        </div>
                      </Field>

                      <Field
                        label="HSN code"
                        htmlFor="sp-hsn"
                        hint="4, 6 or 8 digits"
                        error={!hsnValid ? 'Enter a 4, 6 or 8 digit HSN' : undefined}
                        badge={hsnDirty && <span className="sp-chip" data-tone="warn">Edited</span>}
                      >
                        <input
                          id="sp-hsn"
                          className="sp-input font-mono"
                          inputMode="numeric"
                          maxLength={8}
                          autoComplete="off"
                          value={hsn}
                          aria-invalid={!hsnValid}
                          onChange={(e) => setHsn(e.target.value.replace(/\D/g, ''))}
                        />
                      </Field>

                      <Field
                        label="GST %"
                        htmlFor="sp-gst"
                        error={!gstValid ? 'Enter a rate from 0 to 100' : undefined}
                        badge={gstDirty && <span className="sp-chip" data-tone="warn">Edited</span>}
                      >
                        <div className="sp-affix">
                          <input
                            id="sp-gst"
                            className="sp-input has-suf tabular"
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            step="0.5"
                            value={gst}
                            aria-invalid={!gstValid}
                            onChange={(e) => setGst(e.target.value)}
                          />
                          <span className="sp-suf">%</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Common GST rates">
                          {GST_PRESETS.map((rate) => (
                            <button
                              key={rate}
                              type="button"
                              className="sp-chip sp-chip-btn"
                              aria-pressed={gstValid && gstNum === rate}
                              onClick={() => setGst(String(rate))}
                            >
                              {rate}%
                            </button>
                          ))}
                        </div>
                      </Field>
                    </div>

                    {(hsnDirty || gstDirty) && (
                      <div className="sp-notice mt-4" data-tone="warn" role="status">
                        <Pencil size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <p className="flex-1">
                          HSN or GST was changed. The item record will be updated when you save this entry.
                        </p>
                        <button type="button" className="sp-link-btn" onClick={revertTax}>
                          Undo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Step 3: supply details */}
            <section className="sp-card sp-rise p-5 sm:p-6" style={{ '--i': 2 }}>
              <StepTitle
                n={3}
                title="Supply details"
                subtitle="What arrived, from whom, and at what price."
                state={supplyState}
              />

              <fieldset className="sp-fieldset" disabled={!found}>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Field label="Supplier" htmlFor="sp-supplier" className="sm:col-span-2">
                    <div className="sp-affix">
                      <select
                        id="sp-supplier"
                        ref={supplierRef}
                        className="sp-input"
                        value={supply.supplierId}
                        onChange={setField('supplierId')}
                      >
                        <option value="">Choose a supplier…</option>
                        {DEMO_SUPPLIERS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <span className="sp-suf" aria-hidden="true">
                        ▾
                      </span>
                    </div>
                  </Field>

                  <Field label="MRP" htmlFor="sp-mrp">
                    <div className="sp-affix">
                      <span className="sp-pre">₹</span>
                      <input
                        id="sp-mrp"
                        ref={mrpRef}
                        className="sp-input has-pre tabular"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={supply.mrp}
                        onChange={setField('mrp')}
                      />
                    </div>
                  </Field>

                  <Field
                    label="Purchase price"
                    htmlFor="sp-pp"
                    hint="Per unit"
                    badge={
                      margin != null && (
                        <span className="sp-chip tabular" data-tone={marginTone}>
                          Margin {margin}%
                        </span>
                      )
                    }
                  >
                    <div className="sp-affix">
                      <span className="sp-pre">₹</span>
                      <input
                        id="sp-pp"
                        className="sp-input has-pre tabular"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={supply.purchasePrice}
                        onChange={setField('purchasePrice')}
                      />
                    </div>
                  </Field>

                  <Field label="Quantity received" htmlFor="sp-qty">
                    <div className="sp-stepper">
                      <button type="button" aria-label="Decrease quantity" onClick={() => bumpQty(-1)}>
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <input
                        id="sp-qty"
                        className="sp-input tabular"
                        inputMode="numeric"
                        value={supply.quantity}
                        onChange={(e) =>
                          setSupply((s) => ({ ...s, quantity: e.target.value.replace(/\D/g, '') }))
                        }
                      />
                      <button type="button" aria-label="Increase quantity" onClick={() => bumpQty(1)}>
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </Field>

                  <Field label="Batch number" htmlFor="sp-batch" hint="Optional">
                    <input
                      id="sp-batch"
                      className="sp-input font-mono"
                      autoComplete="off"
                      placeholder="e.g. B2411-07"
                      value={supply.batchNo}
                      onChange={setField('batchNo')}
                    />
                  </Field>

                  <Field label="Manufacture date" htmlFor="sp-mfg-dt" hint="Optional">
                    <input
                      id="sp-mfg-dt"
                      className="sp-input"
                      type="date"
                      value={supply.manufactureDt}
                      onChange={setField('manufactureDt')}
                    />
                  </Field>

                  <Field
                    label="Expiry date"
                    htmlFor="sp-exp-dt"
                    hint="Optional"
                    error={dateConflict ? 'Expiry is before the manufacture date' : undefined}
                    badge={
                      expiry && !dateConflict && (
                        <span className="sp-chip" data-tone={expiry.tone}>
                          {expiry.text}
                        </span>
                      )
                    }
                  >
                    <input
                      id="sp-exp-dt"
                      className="sp-input"
                      type="date"
                      aria-invalid={dateConflict}
                      value={supply.expiryDt}
                      onChange={setField('expiryDt')}
                    />
                  </Field>

                  <Field label="Remarks" htmlFor="sp-remarks" hint="Optional" className="sm:col-span-2">
                    <textarea
                      id="sp-remarks"
                      className="sp-input"
                      rows={3}
                      placeholder="Anything worth noting about this delivery"
                      value={supply.remarks}
                      onChange={setField('remarks')}
                    />
                  </Field>
                </div>

                {pricesOk && pp > mrp && (
                  <div className="sp-notice mt-4" data-tone="danger" role="status">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                    Purchase price is higher than the MRP. Double-check both before saving.
                  </div>
                )}
              </fieldset>
            </section>
          </div>

          {/* ------------------------ summary column ------------------------ */}
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className="sp-rise" style={{ '--i': 1 }}>
              {summary}
            </div>

            {log.length > 0 && (
              <section className="sp-card sp-enter p-5">
                <h2 className="text-sm font-semibold">Added this session</h2>
                <ul className="mt-3 divide-y divide-[var(--sp-border-soft)]">
                  {log.map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{row.name}</p>
                        <p className="sp-hint tabular">Qty {row.qty}</p>
                      </div>
                      <p className="tabular shrink-0 text-sm font-semibold">{inr(row.total)}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>

      {/* Mobile: total + save stay within thumb reach. */}
      <div className="sp-mobile-bar lg:hidden">
        <div className="min-w-0">
          <p className="sp-hint">Value at cost</p>
          <p className="tabular truncate text-lg font-semibold leading-tight">
            {costTotal == null ? '—' : inr(costTotal)}
          </p>
        </div>
        <button type="button" className="sp-btn sp-btn-primary" disabled={!canSave} onClick={handleSave}>
          <PackagePlus size={17} aria-hidden="true" />
          Save entry
        </button>
      </div>
    </div>
  );
}
