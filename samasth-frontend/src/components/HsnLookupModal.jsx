import React, { useState, useEffect, useRef } from 'react';

/**
 * HSN lookup popup: one search box and a results panel.
 *
 * Results are display-only (nothing is picked from the list yet).
 *
 * TODO: wire a real data source. Replace `searchHsn` below with a call to the
 * backend (or a local HSN list) that returns [{ code, description, gst }].
 * The rows in PLACEHOLDER_ROWS are SAMPLE DATA ONLY and are not an authoritative
 * HSN or GST rate reference.
 */
const PLACEHOLDER_ROWS = [
  { code: '0000', description: 'Sample entry A (placeholder)', gst: '—' },
  { code: '0001', description: 'Sample entry B (placeholder)', gst: '—' },
  { code: '0002', description: 'Sample entry C (placeholder)', gst: '—' },
];

// Swap this for the real lookup later. Keep it async so the modal does not change.
const searchHsn = async (query) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PLACEHOLDER_ROWS.filter(
    (row) => row.code.includes(q) || row.description.toLowerCase().includes(q)
  );
};

const HsnLookupModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);

  // Reset and focus the search box every time the popup opens.
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSearched(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Search as the user types (debounced); ignore out-of-date responses.
  useEffect(() => {
    if (!isOpen) return undefined;
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const rows = await searchHsn(query);
        if (!cancelled) {
          setResults(rows);
          setSearched(true);
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hsn-lookup-title"
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-start justify-between">
          <div>
            <h2 id="hsn-lookup-title" className="text-xl font-semibold text-gray-900">
              HSN Lookup
            </h2>
            <p className="text-sm text-gray-600 mt-1">Search by HSN code or product description.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none px-2"
          >
            ×
          </button>
        </div>

        {/* Search box */}
        <div className="px-6 pt-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type an HSN code or description"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Results panel */}
        <div className="px-6 py-4 flex-1 overflow-y-auto min-h-[200px]" aria-live="polite">
          {searching ? (
            <p className="text-sm text-gray-500 text-center py-10">Searching…</p>
          ) : !query.trim() ? (
            <p className="text-sm text-gray-500 text-center py-10">Start typing to see matching HSN codes.</p>
          ) : searched && results.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-10">No matches for “{query.trim()}”.</p>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-2 font-medium w-28">HSN</th>
                    <th className="px-4 py-2 font-medium">Description</th>
                    <th className="px-4 py-2 font-medium w-20 text-right">GST %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((row) => (
                    <tr key={row.code}>
                      <td className="px-4 py-2 font-mono text-gray-900">{row.code}</td>
                      <td className="px-4 py-2 text-gray-700">{row.description}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{row.gst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HsnLookupModal;
