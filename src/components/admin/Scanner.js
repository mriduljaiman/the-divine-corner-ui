import { useEffect, useRef, useState } from 'react';
import { FiCameraOff, FiRefreshCw } from 'react-icons/fi';

const REGION_ID = 'dc-scanner-region';

/**
 * Continuous camera scanner (QR + common 1D barcodes). Calls onScan(text) for every new code;
 * the same code is ignored for `cooldownMs` so one label is not added twice by accident.
 */
export default function Scanner({ onScan, cooldownMs = 1500 }) {
  const scannerRef = useRef(null);
  const lastRef = useRef({ text: '', at: 0 });
  const onScanRef = useRef(onScan);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(true);
  const [attempt, setAttempt] = useState(0);

  onScanRef.current = onScan;

  useEffect(() => {
    let cancelled = false;
    let instance;

    (async () => {
      setStarting(true);
      setError('');
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats: F } = await import('html5-qrcode');
        if (cancelled) return;
        instance = new Html5Qrcode(REGION_ID, {
          verbose: false,
          formatsToSupport: [F.QR_CODE, F.CODE_128, F.EAN_13, F.EAN_8, F.CODE_39, F.UPC_A],
          useBarCodeDetectorIfSupported: true,
        });
        scannerRef.current = instance;
        await instance.start(
          { facingMode: 'environment' },
          {
            fps: 12,
            qrbox: (w, h) => {
              const size = Math.floor(Math.min(w, h) * 0.75);
              return { width: Math.min(w * 0.9, size * 1.4), height: size };
            },
            aspectRatio: 1.333,
          },
          (text) => {
            const now = Date.now();
            if (text === lastRef.current.text && now - lastRef.current.at < cooldownMs) return;
            lastRef.current = { text, at: now };
            onScanRef.current?.(text);
          },
          () => { /* no code in this frame */ },
        );
      } catch (err) {
        if (!cancelled) {
          const msg = String(err?.message || err);
          setError(/permission|NotAllowed/i.test(msg)
            ? 'Camera permission denied. Allow camera access in the browser settings.'
            : /secure|https/i.test(msg)
              ? 'Camera needs a secure (https) connection.'
              : 'Could not start the camera. You can still type or scan with a USB scanner.');
        }
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        s.stop().catch(() => {}).finally(() => { try { s.clear(); } catch { /* already cleared */ } });
      }
    };
  }, [attempt, cooldownMs]);

  return (
    <div className="dc-scanner">
      <div id={REGION_ID} className="dc-scanner-region" />
      {starting && !error && <div className="dc-scanner-msg">Starting camera…</div>}
      {error && (
        <div className="dc-scanner-msg error">
          <FiCameraOff size={28} />
          <p>{error}</p>
          <button type="button" className="adm-btn sm" onClick={() => setAttempt(a => a + 1)}>
            <FiRefreshCw /> Try again
          </button>
        </div>
      )}
      <style jsx>{`
        .dc-scanner { position: relative; width: 100%; aspect-ratio: 4 / 3; background: #0b0a1a; border-radius: 14px; overflow: hidden; }
        .dc-scanner-region { width: 100%; height: 100%; }
        .dc-scanner :global(video) { width: 100% !important; height: 100% !important; object-fit: cover; }
        .dc-scanner-msg {
          position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 10px; color: #cbd0e6; font-size: 0.88rem; text-align: center; padding: 20px;
        }
        .dc-scanner-msg p { margin: 0; max-width: 280px; }
      `}</style>
    </div>
  );
}
