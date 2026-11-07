import { useEffect, useRef } from 'react';

// USB barcode scanners behave like keyboards that type very fast (usually
// < 20 ms between characters) and finish with Enter. A run of keystrokes is
// treated as a "scan" only when every key arrived within MAX_INTERVAL_MS of
// the previous one and the run ends in Enter. Slower typing is left alone, so
// normal data entry is never hijacked.
//
// Adapted from nodedr-pos (frontend/hooks/useBarcodeScanner.ts).
const MAX_INTERVAL_MS = 50;
const MIN_BARCODE_LENGTH = 3;

/**
 * @param {object} options
 * @param {(code: string) => void} options.onScan   Called with the scanned code.
 * @param {(event: KeyboardEvent) => boolean} [options.shouldIgnore]
 *        Return true to skip an event (e.g. focus is in an unrelated input).
 * @param {boolean} [options.enabled=true]
 */
export function useBarcodeScanner({ onScan, shouldIgnore, enabled = true }) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const onScanRef = useRef(onScan);
  const shouldIgnoreRef = useRef(shouldIgnore);

  // Keep the latest callbacks without re-binding the window listener.
  useEffect(() => {
    onScanRef.current = onScan;
    shouldIgnoreRef.current = shouldIgnore;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    function handleKeyDown(event) {
      if (shouldIgnoreRef.current?.(event)) {
        bufferRef.current = '';
        return;
      }

      const now = performance.now();
      const elapsed = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      if (elapsed > MAX_INTERVAL_MS) {
        bufferRef.current = '';
      }

      if (event.key === 'Enter') {
        const code = bufferRef.current;
        bufferRef.current = '';
        if (code.length >= MIN_BARCODE_LENGTH && elapsed <= MAX_INTERVAL_MS) {
          event.preventDefault();
          onScanRef.current(code);
        }
        return;
      }

      if (event.key.length === 1) {
        bufferRef.current += event.key;
      }
    }

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled]);
}

export default useBarcodeScanner;
