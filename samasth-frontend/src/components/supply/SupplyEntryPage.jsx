import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Check,
  Loader2,
  PackagePlus,
  ScanBarcode,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import './SupplyEntryPage.css';

/* -------------------------------------------------------------------------
 * DESIGN PREVIEW: no API wiring yet.
 *
 * DEMO_ITEMS / DEMO_SUPPLIERS / lookupItem() stand in for the backend.
 * When wiring up:
 *   - lookupItem(code)  -> GET item by barcode. Needs: e_id, name, barcode,
 *                          manufacturer, HSN, GST %. Optional but recommended:
 *                          lastMrp / lastPp (most recent supply prices) so the
 *                          grid can pre-fill them and cut keystrokes.
 *   - DEMO_SUPPLIERS    -> supplier list (es_s_id)
 *   - handleSave()      -> POST the `lines` payload it already builds (one
 *                          s_entity_supplier row per grid row) and apply the
 *                          `item_updates` list for edited HSN / GST.
 * ---------------------------------------------------------------------- */
const DEMO_ITEMS = {
  '8901234567890': { eId: 'E1001', name: 'Basmati Rice 5 kg', barcode: '8901234567890', manufacturer: 'Daawat Foods Ltd', hsn: '10063020', gst: 5, lastMrp: 520, lastPp: 455 },
  '8909876543210': { eId: 'E1002', name: 'Masala Chai 250 g', barcode: '8909876543210', manufacturer: 'Tata Consumer Products', hsn: '0902', gst: 5, lastMrp: 135, lastPp: 112 },
  '8905551234567': { eId: 'E1003', name: 'Hand Wash Refill 750 ml', barcode: '8905551234567', manufacturer: 'Hindustan Unilever', hsn: '3401', gst: 18, lastMrp: 199, lastPp: 164 },
  '8904443332221': { eId: 'E1004', name: 'Toor Dal 1 kg', barcode: '8904443332221', manufacturer: 'Tata Sampann', hsn: '0713', gst: 5, lastMrp: 185, lastPp: 160 },
  '8907778889990': { eId: 'E1005', name: 'Sunflower Oil 1 L', barcode: '8907778889990', manufacturer: 'Fortune (Adani Wilmar)', hsn: '1512', gst: 5, lastMrp: 165, lastPp: 142 },
};
const DEMO_MISSING_CODE = '0000000000000';

const DEMO_SUPPLIERS = [
  { id: 'S001', name: 'Sri Lakshmi Traders' },
  { id: 'S002', name: 'Bharat Wholesale Mart' },
  { id: 'S003', name: 'Kaveri Distributors' },
];

const lookupItem = (code) =>
  new Promise((resolve) => {
    setTimeout(() => resolve(DEMO_ITEMS[code] || null), 180);
  });

/* ----------------------------------------------------------------------- */

const DRAFT_KEY = 'samasth.supplyEntryDraft.v1';

// Keyboard flow: Enter walks these left to right, then returns to the scanner.
// HSN, GST and Remarks are rarely changed, so they are reachable with Tab/click
// but skipped by Enter.
const ENTER_ORDER = ['qty', 'mrp', 'pp', 'batch', 'mfg', 'exp'];
const HSN_PATTERN = /^\d{4}(\d{2}(\d{2})?)?$/;

const pad = (n) => String(n).padStart(2, '0');
const toNum = (v) => (v === '' || v == null ? NaN : Number(v));
const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);

/**
 * Fast date typing: 0127 (MM YY), 150127 (DD MM YY) or 15012027 (DD MM YYYY).
 * MM/YY means the 1st for a manufacture date and the last day for an expiry.
 */
function parseDateText(text, endOfMonth) {
  const d = (text || '').replace(/\D/g, '');
  let day;
  let month;
  let year;
  if (d.length === 4) {
    month = +d.slice(0, 2);
    year = 2000 + +d.slice(2);
    day = endOfMonth ? new Date(year, month, 0).getDate() : 1;
  } else if (d.length === 6) {
    day = +d.slice(0, 2);
    month = +d.slice(2, 4);
    year = 2000 + +d.slice(4);
  } else if (d.length === 8) {
    day = +d.slice(0, 2);
    month = +d.slice(2, 4);
    year = +d.slice(4);
  } else {
    return null;
  }
  const dt = new Date(year, month - 1, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
  return { iso: `${year}-${pad(month)}-${pad(day)}`, display: `${pad(day)}/${pad(month)}/${year}` };
}

const todayIso = () => {
  const t = new Date();
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
};

let seqCounter = 0;
const makeRow = (item) => ({
  id: `r${Date.now().toString(36)}${(seqCounter += 1)}`,
  eId: item.eId,
  name: item.name,
  barcode: item.barcode,
  manufacturer: item.manufacturer,
  itemHsn: item.hsn,
  itemGst: String(item.gst),
  hsn: item.hsn,
  gst: String(item.gst),
  qty: '1',
  mrp: item.lastMrp != null ? String(item.lastMrp) : '',
  pp: item.lastPp != null ? String(item.lastPp) : '',
  prefilled: { mrp: item.lastMrp != null, pp: item.lastPp != null },
  batch: '',
  mfgText: '',
  mfgIso: null,
  expText: '',
  expIso: null,
  remarks: '',
});

/** Per-cell state: 'need' (empty required), 'bad' (invalid), 'warn' (allowed but odd). */
function validateRow(r) {
  const s = {};
  const qty = toNum(r.qty);
  const mrp = toNum(r.mrp);
  const pp = toNum(r.pp);
  const gst = toNum(r.gst);

  if (r.qty === '') s.qty = 'need';
  else if (!(Number.isInteger(qty) && qty > 0)) s.qty = 'bad';

  if (r.mrp === '') s.mrp = 'need';
  else if (!(mrp > 0)) s.mrp = 'bad';

  if (r.pp === '') s.pp = 'need';
  else if (!(pp > 0)) s.pp = 'bad';
  else if (mrp > 0 && pp > mrp) s.pp = 'warn';

  if (r.hsn === '') s.hsn = 'need';
  else if (!HSN_PATTERN.test(r.hsn)) s.hsn = 'bad';

  if (r.gst === '') s.gst = 'need';
  else if (!(Number.isFinite(gst) && gst >= 0 && gst <= 100)) s.gst = 'bad';

  if (r.mfgText && !r.mfgIso) s.mfg = 'bad';
  if (r.expText && !r.expIso) s.exp = 'bad';
  if (r.mfgIso && r.expIso && r.expIso < r.mfgIso) s.exp = 'bad';
  else if (r.expIso && !s.exp && r.expIso < todayIso()) s.exp = 'warn';

  return s;
}
const rowBlocking = (s) => Object.values(s).some((v) => v === 'need' || v === 'bad');

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return Array.isArray(d.rows) ? d : null;
  } catch {
    return null;
  }
}

/* -------------------------------- page ---------------------------------- */

export default function SupplyEntryPage() {
  const draft = useMemo(loadDraft, []);

  const scanRef = useRef(null);
  const supplierRef = useRef(null);
  const cellRefs = useRef({});
  const rowEls = useRef({});
  const pendingFocus = useRef(null);
  const flashTimer = useRef(null);
  const queueRef = useRef(Promise.resolve());

  const [supplierId, setSupplierId] = useState(draft?.supplierId || '');
  const [rows, setRowsState] = useState(draft?.rows || []);
  const rowsRef = useRef(rows);
  const [barcode, setBarcode] = useState('');
  const [scanState, setScanState] = useState('idle'); // idle | loading | missing
  const [message, setMessage] = useState(null); // { tone, text }
  const [missing, setMissing] = useState([]);
  const [flashId, setFlashId] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [restored] = useState(!!draft && draft.rows.length > 0);

  const setRows = useCallback((updater) => {
    const next = typeof updater === 'function' ? updater(rowsRef.current) : updater;
    rowsRef.current = next;
    setRowsState(next);
  }, []);

  /* ---- draft autosave: 20-30 lines of typing should survive a refresh ---- */
  useEffect(() => {
    try {
      if (rows.length === 0 && !supplierId) localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, JSON.stringify({ supplierId, rows }));
    } catch {
      /* storage unavailable: the page still works without a draft */
    }
  }, [rows, supplierId]);

  /* ---- focus helpers ---- */
  const focusScan = useCallback(() => {
    scanRef.current?.focus();
    scanRef.current?.select();
  }, []);

  const focusCell = useCallback((rowId, col) => {
    const el = cellRefs.current[`${rowId}:${col}`];
    if (el) {
      el.focus();
      el.select?.();
    }
  }, []);

  // After a scan adds or bumps a row, jump to its quantity cell.
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    focusCell(target, 'qty');
    rowEls.current[target]?.scrollIntoView({ block: 'nearest' });
  }, [rows, focusCell]);

  /* ---- scanning ---- */
  const flash = (id) => {
    setFlashId(id);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashId(null), 900);
  };

  const processCode = useCallback(
    async (raw) => {
      const code = (raw || '').trim();
      if (!code) return;
      setScanState('loading');
      const item = await lookupItem(code);

      if (!item) {
        setScanState('missing');
        setMessage({ tone: 'danger', text: `No item found for ${code}` });
        setMissing((m) => (m.includes(code) ? m : [...m, code]));
        setBarcode('');
        focusScan();
        return;
      }

      setScanState('idle');
      setBarcode('');
      const existing = rowsRef.current.find((r) => r.barcode === item.barcode);
      if (existing) {
        // Same item scanned again: count it instead of adding a duplicate row.
        const qty = (parseInt(existing.qty, 10) || 0) + 1;
        setRows((prev) => prev.map((r) => (r.id === existing.id ? { ...r, qty: String(qty) } : r)));
        pendingFocus.current = existing.id;
        flash(existing.id);
        setMessage({ tone: 'ok', text: `${item.name}: quantity is now ${qty}` });
      } else {
        const row = makeRow(item);
        setRows((prev) => [...prev, row]);
        pendingFocus.current = row.id;
        setMessage({ tone: 'ok', text: `Added ${item.name}` });
      }
    },
    [focusScan, setRows]
  );

  // Serialise scans so two quick scans of one item cannot both create a row.
  const submitCode = useCallback(
    (code) => {
      queueRef.current = queueRef.current.then(() => processCode(code));
    },
    [processCode]
  );

  useBarcodeScanner({
    onScan: (code) => submitCode(code),
    // A scan is only taken from the barcode box (or outside any field), so
    // it can never be typed into a price cell by mistake.
    shouldIgnore: (e) => {
      const el = e.target;
      return /^(INPUT|TEXTAREA|SELECT)$/.test(el?.tagName || '') && el.id !== 'sp-barcode';
    },
  });

  /* ---- editing ---- */
  const patchRow = (id, patch) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    focusScan();
  };

  const onNumber = (id, key, pattern) => (e) => {
    const v = e.target.value;
    if (v !== '' && !pattern.test(v)) return;
    patchRow(id, {
      [key]: v,
      ...(key === 'mrp' || key === 'pp' ? { prefilled: { ...rowsRef.current.find((r) => r.id === id).prefilled, [key]: false } } : {}),
    });
  };

  const onDateChange = (id, which) => (e) => {
    const text = e.target.value.replace(/[^\d/.-]/g, '');
    const parsed = parseDateText(text, which === 'exp');
    patchRow(id, which === 'mfg' ? { mfgText: text, mfgIso: parsed?.iso ?? null } : { expText: text, expIso: parsed?.iso ?? null });
  };

  const onDateBlur = (r, which) => {
    const text = which === 'mfg' ? r.mfgText : r.expText;
    const parsed = parseDateText(text, which === 'exp');
    if (parsed) patchRow(r.id, which === 'mfg' ? { mfgText: parsed.display } : { expText: parsed.display });
  };

  const onCellKeyDown = (e, r, col, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const at = ENTER_ORDER.indexOf(col);
      if (at >= 0 && at < ENTER_ORDER.length - 1) focusCell(r.id, ENTER_ORDER[at + 1]);
      else focusScan();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      focusScan();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const other = rowsRef.current[index + (e.key === 'ArrowDown' ? 1 : -1)];
      if (other) {
        e.preventDefault();
        focusCell(other.id, col);
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
      // Copy the cell above, spreadsheet style (handy for batch and dates).
      e.preventDefault();
      const above = rowsRef.current[index - 1];
      if (!above) return;
      const map = {
        qty: { qty: above.qty },
        mrp: { mrp: above.mrp, prefilled: { ...r.prefilled, mrp: false } },
        pp: { pp: above.pp, prefilled: { ...r.prefilled, pp: false } },
        batch: { batch: above.batch },
        mfg: { mfgText: above.mfgText, mfgIso: above.mfgIso },
        exp: { expText: above.expText, expIso: above.expIso },
        hsn: { hsn: above.hsn },
        gst: { gst: above.gst },
        remarks: { remarks: above.remarks },
      };
      if (map[col]) patchRow(r.id, map[col]);
    }
  };

  /* ---- derived ---- */
  const checked = useMemo(
    () => rows.map((r) => ({ row: r, state: validateRow(r) })),
    [rows]
  );
  const blockingRows = checked.filter((c) => rowBlocking(c.state));
  const totals = useMemo(() => {
    let units = 0;
    let cost = 0;
    let mrpValue = 0;
    for (const r of rows) {
      const q = parseInt(r.qty, 10);
      if (!(q > 0)) continue;
      units += q;
      if (toNum(r.pp) > 0) cost += q * toNum(r.pp);
      if (toNum(r.mrp) > 0) mrpValue += q * toNum(r.mrp);
    }
    return { units, cost, mrpValue, margin: mrpValue > 0 ? ((mrpValue - cost) / mrpValue) * 100 : null };
  }, [rows]);

  const canSave = !!supplierId && rows.length > 0 && blockingRows.length === 0;

  /* ---- save ---- */
  const handleSave = useCallback(() => {
    if (!canSave) {
      setShowErrors(true);
      if (!supplierId) supplierRef.current?.focus();
      else if (blockingRows[0]) {
        const first = blockingRows[0];
        const col = ['qty', 'mrp', 'pp', 'hsn', 'gst', 'mfg', 'exp'].find((c) => first.state[c] === 'need' || first.state[c] === 'bad');
        focusCell(first.row.id, col || 'qty');
        rowEls.current[first.row.id]?.scrollIntoView({ block: 'center' });
      }
      return;
    }
    const iso = (d) => (d ? `${d}T00:00:00Z` : undefined);
    const lines = rows.map((r) => ({
      e_id: r.eId,
      s_id: supplierId,
      mrp: toNum(r.mrp),
      purchase_price: toNum(r.pp),
      stock_quantity: parseInt(r.qty, 10),
      remarks: r.remarks || undefined,
      batchno: r.batch || undefined,
      manfacture_dt: iso(r.mfgIso),
      expirydt: iso(r.expIso),
    }));
    const item_updates = rows
      .filter((r) => r.hsn !== r.itemHsn || r.gst !== r.itemGst)
      .map((r) => ({ e_id: r.eId, hsn: r.hsn, gst: toNum(r.gst) }));

    // TODO(wire): POST { lines, item_updates } in ONE request so the whole
    // delivery saves or fails together. Preview only for now.
    console.debug('[SupplyEntry] payload (preview only)', { lines, item_updates });

    toast.success(`${lines.length} items (${totals.units} units) recorded`);
    setRows([]);
    setShowErrors(false);
    setMessage(null);
    setMissing([]);
    focusScan();
  }, [canSave, supplierId, blockingRows, rows, totals.units, focusCell, focusScan, setRows]);

  // Ctrl/Cmd+S saves from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave]);

  const clearAll = () => {
    if (rows.length > 0 && !window.confirm(`Remove all ${rows.length} items from this entry?`)) return;
    setRows([]);
    setShowErrors(false);
    setMessage(null);
    setMissing([]);
    focusScan();
  };

  /* ---- render helpers ---- */
  const cellState = (state, col, extra) => {
    const s = state[col];
    if (s === 'need') return showErrors ? 'bad' : 'need';
    return s || extra || undefined;
  };

  const renderCell = (r, state, index, col, props) => {
    const { value, onChange, onBlur, extra, align, placeholder, inputMode = 'text', maxLength, className = '', ariaLabel } = props;
    return (
      <td>
        <input
          ref={(el) => {
            if (el) cellRefs.current[`${r.id}:${col}`] = el;
            else delete cellRefs.current[`${r.id}:${col}`];
          }}
          className={`sp-cell ${align === 'r' ? 'r tabular' : ''} ${className}`}
          data-state={cellState(state, col, extra)}
          aria-label={`${ariaLabel} for ${r.name}`}
          aria-invalid={state[col] === 'bad' || (showErrors && state[col] === 'need')}
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => onCellKeyDown(e, r, col, index)}
        />
      </td>
    );
  };

  const money = /^\d*\.?\d{0,2}$/;
  const digits = /^\d*$/;
  const rate = /^\d{0,3}(\.\d?)?$/;

  const statusLine = (() => {
    if (scanState === 'loading') {
      return (
        <span className="sp-hint inline-flex items-center gap-2">
          <Loader2 size={14} className="sp-spin" aria-hidden="true" /> Looking up…
        </span>
      );
    }
    if (message) {
      const color = message.tone === 'danger' ? 'var(--sp-danger)' : 'var(--sp-brand)';
      const Icon = message.tone === 'danger' ? AlertTriangle : Check;
      return (
        <span className="inline-flex items-center gap-2 text-[0.8125rem] font-medium" style={{ color }}>
          <Icon size={14} aria-hidden="true" /> {message.text}
        </span>
      );
    }
    return null;
  })();

  return (
    <div className="sp">
      {/* Header */}
      <div className="sp-header">
        <div className="flex items-center gap-3">
          <span className="sp-logo">
            <Truck size={19} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight">Supply Entry</h1>
            <p className="sp-hint">Pick the supplier, then scan each item that arrived</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {restored && rows.length > 0 && <span className="sp-chip" data-tone="warn">Draft restored</span>}
          <span className="sp-chip" data-tone="ok">
            <span className="sp-pulse" aria-hidden="true" />
            Scanner ready
          </span>
          <button type="button" className="sp-btn sp-btn-soft" onClick={clearAll} disabled={rows.length === 0}>
            <Trash2 size={15} aria-hidden="true" />
            Clear all
          </button>
        </div>
      </div>

      {/* Supplier + scan strip */}
      <div className="sp-strip">
        <div className="sp-supplier">
          <label htmlFor="sp-supplier" className="sp-label">
            Supplier (applies to every item)
          </label>
          <div className="sp-select-wrap mt-1">
            <select
              id="sp-supplier"
              ref={supplierRef}
              className="sp-input"
              data-state={showErrors && !supplierId ? 'need' : undefined}
              value={supplierId}
              onChange={(e) => {
                setSupplierId(e.target.value);
                if (e.target.value) focusScan();
              }}
            >
              <option value="">Choose a supplier…</option>
              {DEMO_SUPPLIERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <span aria-hidden="true">▾</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <label htmlFor="sp-barcode" className="sp-label">
            Barcode
          </label>
          <div className="sp-scan mt-1" data-state={scanState}>
            <ScanBarcode size={24} className="shrink-0 text-[var(--sp-brand)]" aria-hidden="true" />
            <input
              id="sp-barcode"
              ref={scanRef}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              placeholder="Scan or type a barcode, then press Enter"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => {
                // A scanner's Enter is already handled by the page-level hook.
                if (e.key === 'Enter' && !e.defaultPrevented) {
                  e.preventDefault();
                  submitCode(barcode);
                }
              }}
            />
            {barcode && (
              <button type="button" className="sp-icon-btn" aria-label="Clear barcode" onClick={() => setBarcode('')}>
                <X size={16} aria-hidden="true" />
              </button>
            )}
            <span className="sp-kbd mr-1 hidden sm:inline-flex">Enter</span>
          </div>
        </div>

        <div className="hidden min-w-[220px] max-w-[300px] pb-2 lg:block" aria-live="polite">
          {statusLine}
        </div>
      </div>

      {missing.length > 0 && (
        <div className="sp-notice" data-tone="danger" role="status">
          <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            Not in the item master: <span className="mono font-semibold">{missing.join(', ')}</span>
          </span>
          <Link to="/items" className="sp-link-btn">
            Create in Entity Management
          </Link>
          <button type="button" className="sp-icon-btn" aria-label="Dismiss" onClick={() => setMissing([])}>
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="sp-body">
        {rows.length === 0 ? (
          <div className="sp-empty">
            <span className="sp-empty-icon">
              <ScanBarcode size={30} aria-hidden="true" />
            </span>
            <p className="text-base font-semibold text-[var(--sp-fg)]">Scan the first item to begin</p>
            <p className="sp-hint max-w-md">
              Each scan adds a row. Scanning the same item again adds one to its quantity. Everything is saved
              together when you press Save.
            </p>
            {/* Remove with the demo data. */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="sp-hint">Preview with:</span>
              {[...Object.keys(DEMO_ITEMS), DEMO_MISSING_CODE].map((code) => (
                <button key={code} type="button" className="sp-chip sp-chip-btn mono" onClick={() => submitCode(code)}>
                  {code}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <table className="sp-grid">
            <thead>
              <tr>
                <th className="c-no">#</th>
                <th className="c-item">Item</th>
                <th className="r" style={{ width: 90 }}>Qty</th>
                <th className="r" style={{ width: 110 }}>MRP ₹</th>
                <th className="r" style={{ width: 110 }}>Cost ₹</th>
                <th style={{ width: 130 }}>Batch no</th>
                <th style={{ width: 120 }}>Mfg date</th>
                <th style={{ width: 120 }}>Expiry</th>
                <th style={{ width: 110 }}>HSN</th>
                <th className="r" style={{ width: 80 }}>GST %</th>
                <th style={{ width: 190 }}>Remarks</th>
                <th className="r" style={{ width: 70 }}>Margin</th>
                <th className="r" style={{ width: 120 }}>Line total</th>
                <th style={{ width: 44 }} aria-label="Remove" />
              </tr>
            </thead>
            <tbody>
              {checked.map(({ row: r, state }, index) => {
                const blocking = rowBlocking(state);
                const bad = showErrors && blocking;
                const mrp = toNum(r.mrp);
                const pp = toNum(r.pp);
                const qty = parseInt(r.qty, 10);
                const margin = mrp > 0 && pp > 0 ? ((mrp - pp) / mrp) * 100 : null;
                return (
                  <tr
                    key={r.id}
                    ref={(el) => {
                      if (el) rowEls.current[r.id] = el;
                      else delete rowEls.current[r.id];
                    }}
                    data-flash={flashId === r.id}
                    className="sp-row-new"
                  >
                    <td className="c-no">
                      <span className="sp-rowno" data-ok={!blocking} data-bad={bad}>
                        {blocking ? index + 1 : <Check size={13} strokeWidth={3} aria-hidden="true" />}
                      </span>
                    </td>
                    <td className="c-item">
                      <div className="sp-item-cell">
                        <p className="sp-item-name truncate" title={r.name}>{r.name}</p>
                        <p className="sp-item-meta truncate">
                          <span className="mono">{r.barcode}</span> · {r.manufacturer}
                        </p>
                      </div>
                    </td>

                    {renderCell(r, state, index, 'qty', {
                      value: r.qty, align: 'r', inputMode: 'numeric', maxLength: 6, className: 'sp-cell-qty',
                      ariaLabel: 'Quantity', onChange: onNumber(r.id, 'qty', digits),
                    })}
                    {renderCell(r, state, index, 'mrp', {
                      value: r.mrp, align: 'r', inputMode: 'decimal', placeholder: '0.00',
                      extra: r.prefilled.mrp ? 'pre' : undefined,
                      ariaLabel: 'MRP', onChange: onNumber(r.id, 'mrp', money),
                    })}
                    {renderCell(r, state, index, 'pp', {
                      value: r.pp, align: 'r', inputMode: 'decimal', placeholder: '0.00',
                      extra: r.prefilled.pp ? 'pre' : undefined,
                      ariaLabel: 'Purchase price', onChange: onNumber(r.id, 'pp', money),
                    })}
                    {renderCell(r, state, index, 'batch', {
                      value: r.batch, className: 'mono', placeholder: 'optional', maxLength: 40,
                      ariaLabel: 'Batch number', onChange: (e) => patchRow(r.id, { batch: e.target.value }),
                    })}
                    {renderCell(r, state, index, 'mfg', {
                      value: r.mfgText, placeholder: 'MMYY', maxLength: 10, inputMode: 'numeric',
                      ariaLabel: 'Manufacture date', onChange: onDateChange(r.id, 'mfg'), onBlur: () => onDateBlur(r, 'mfg'),
                    })}
                    {renderCell(r, state, index, 'exp', {
                      value: r.expText, placeholder: 'MMYY', maxLength: 10, inputMode: 'numeric',
                      ariaLabel: 'Expiry date', onChange: onDateChange(r.id, 'exp'), onBlur: () => onDateBlur(r, 'exp'),
                    })}
                    {renderCell(r, state, index, 'hsn', {
                      value: r.hsn, className: 'mono', inputMode: 'numeric', maxLength: 8,
                      extra: r.hsn !== r.itemHsn ? 'edited' : undefined,
                      ariaLabel: 'HSN', onChange: onNumber(r.id, 'hsn', digits),
                    })}
                    {renderCell(r, state, index, 'gst', {
                      value: r.gst, align: 'r', inputMode: 'decimal', maxLength: 5,
                      extra: r.gst !== r.itemGst ? 'edited' : undefined,
                      ariaLabel: 'GST percent', onChange: onNumber(r.id, 'gst', rate),
                    })}
                    {renderCell(r, state, index, 'remarks', {
                      value: r.remarks, placeholder: 'optional', maxLength: 200,
                      ariaLabel: 'Remarks', onChange: (e) => patchRow(r.id, { remarks: e.target.value }),
                    })}

                    <td className="sp-margin">
                      {margin == null ? (
                        <span className="sp-hint">—</span>
                      ) : (
                        <span className="sp-chip tabular" data-tone={margin < 0 ? 'danger' : margin < 5 ? 'warn' : 'ok'}>
                          {margin.toFixed(0)}%
                        </span>
                      )}
                    </td>
                    <td className="sp-total tabular">{qty > 0 && pp > 0 ? inr(qty * pp) : '—'}</td>
                    <td>
                      <button type="button" className="sp-icon-btn danger" aria-label={`Remove ${r.name}`} onClick={() => removeRow(r.id)}>
                        <X size={16} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer: totals + save */}
      <div className="sp-footer">
        <div className="flex min-w-0 items-center gap-5">
          <div className="sp-foot-stat">
            <span className="sp-foot-label">Items</span>
            <span className="sp-foot-val tabular">{rows.length}</span>
          </div>
          <div className="sp-foot-stat">
            <span className="sp-foot-label">Units</span>
            <span className="sp-foot-val tabular">{totals.units}</span>
          </div>
          <span className="sp-foot-sep" />
          <div className="sp-foot-stat">
            <span className="sp-foot-label">Value at cost</span>
            <span className="sp-foot-val big tabular">{inr(totals.cost)}</span>
          </div>
          <div className="sp-foot-stat hidden md:flex">
            <span className="sp-foot-label">At MRP</span>
            <span className="sp-foot-val tabular">{inr(totals.mrpValue)}</span>
          </div>
          <div className="sp-foot-stat hidden md:flex">
            <span className="sp-foot-label">Margin</span>
            <span className="sp-foot-val tabular">{totals.margin == null ? '—' : `${totals.margin.toFixed(1)}%`}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <p className="hidden text-xs xl:block" style={{ color: 'rgb(207 230 216 / 70%)' }}>
            <span className="sp-kbd">Enter</span> next cell · <span className="sp-kbd">↑↓</span> row ·{' '}
            <span className="sp-kbd">Ctrl+D</span> copy down · <span className="sp-kbd">Esc</span> scanner ·{' '}
            <span className="sp-kbd">Ctrl+S</span> save
          </p>
          {rows.length > 0 && (!supplierId || blockingRows.length > 0) && (
            <span className="sp-chip" data-tone="warn">
              {!supplierId ? 'Choose a supplier' : `${blockingRows.length} item${blockingRows.length === 1 ? '' : 's'} need attention`}
            </span>
          )}
          <button type="button" className="sp-btn sp-btn-mint sp-btn-lg" disabled={rows.length === 0} onClick={handleSave}>
            <PackagePlus size={18} aria-hidden="true" />
            Save {rows.length > 0 ? `${rows.length} item${rows.length === 1 ? '' : 's'}` : 'entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
