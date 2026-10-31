import { useEffect, useRef, useState } from 'react';
import { FiCameraOff, FiRefreshCw, FiZap, FiZapOff } from 'react-icons/fi';
import { loadDetector } from '../../utils/barcodeReader';

// Part of the frame that is decoded (matches the box drawn on screen): smaller = faster.
const ROI = { w: 0.86, h: 0.5 };
const SCAN_EVERY_MS = 60;
// Decode a downscaled copy: a label filling the box still has ~4px per bar at this width,
// which is plenty for Code128, and it is several times faster on slow phones.
const DECODE_WIDTH = 720;

/**
 * Continuous camera scanner. The camera starts immediately; decoding begins as soon as the
 * (preloaded) detector is ready. Calls onScan(text) for each new code; the same code is
 * ignored for `cooldownMs` so one label is not added twice by accident.
 */
export default function Scanner({ onScan, cooldownMs = 1500 }) {
  const videoRef = useRef(null);
  const onScanRef = useRef(onScan);
  const [status, setStatus] = useState('starting'); // starting | live | error
  const [error, setError] = useState('');
  const [torch, setTorch] = useState({ supported: false, on: false });
  const [attempt, setAttempt] = useState(0);
  const trackRef = useRef(null);

  onScanRef.current = onScan;

  useEffect(() => {
    let stopped = false;
    let stream = null;
    let timer = null;
    let busy = false;
    const last = { text: '', at: 0 };
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const detectorReady = loadDetector(); // usually already preloaded by the admin shell

    const tick = async (detector) => {
      if (stopped) return;
      const video = videoRef.current;
      if (!busy && video && video.readyState >= 2 && !document.hidden) {
        busy = true;
        try {
          const vw = video.videoWidth, vh = video.videoHeight;
          const sw = Math.round(vw * ROI.w), sh = Math.round(vh * ROI.h);
          const k = Math.min(1, DECODE_WIDTH / sw);
          canvas.width = Math.round(sw * k);
          canvas.height = Math.round(sh * k);
          ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
          const codes = await detector.detect(canvas);
          const text = codes[0]?.rawValue;
          if (text) {
            const now = Date.now();
            if (text !== last.text || now - last.at > cooldownMs) {
              last.text = text;
              last.at = now;
              onScanRef.current?.(text);
            }
          }
        } catch { /* a bad frame is fine, try the next one */ }
        busy = false;
      }
      timer = setTimeout(() => tick(detector), SCAN_EVERY_MS);
    };

    (async () => {
      setStatus('starting');
      setError('');
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(window.isSecureContext ? 'No camera API' : 'secure');
        }
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        const video = videoRef.current;
        video.srcObject = stream;
        await video.play().catch(() => {});
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;
        const caps = track.getCapabilities?.() || {};
        setTorch({ supported: !!caps.torch, on: false });
        setStatus('live');
        const detector = await detectorReady;
        if (!stopped) tick(detector);
      } catch (err) {
        if (stopped) return;
        const msg = String(err?.name || '') + ' ' + String(err?.message || err);
        setError(/NotAllowed|Permission|denied/i.test(msg)
          ? 'Camera permission denied. Allow camera access in the browser settings.'
          : /secure/i.test(msg)
            ? 'Camera needs a secure (https) connection.'
            : /NotFound|Overconstrained|DevicesNotFound/i.test(msg)
              ? 'No camera found on this device.'
              : 'Could not start the scanner. You can still type or use a USB scanner.');
        setStatus('error');
      }
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach(t => t.stop());
      trackRef.current = null;
    };
  }, [attempt, cooldownMs]);

  const toggleTorch = async () => {
    const track = trackRef.current;
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torch.on }] });
      setTorch(t => ({ ...t, on: !t.on }));
    } catch { /* torch not available after all */ }
  };

  return (
    <div className="dc-scanner">
      <video ref={videoRef} className="dc-scanner-video" playsInline muted autoPlay />
      {status === 'live' && (
        <>
          <div className="dc-scanner-box" style={{ width: `${ROI.w * 100}%`, height: `${ROI.h * 100}%` }}>
            <span className="dc-scanner-laser" />
          </div>
          {torch.supported && (
            <button type="button" className="dc-scanner-torch" onClick={toggleTorch} aria-label="Flashlight">
              {torch.on ? <FiZapOff /> : <FiZap />}
            </button>
          )}
        </>
      )}
      {status === 'starting' && <div className="dc-scanner-msg">Starting camera…</div>}
      {status === 'error' && (
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
        .dc-scanner-video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .dc-scanner-box {
          position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
          border: 2px solid rgba(255, 255, 255, 0.9); border-radius: 12px;
          box-shadow: 0 0 0 999px rgba(0, 0, 0, 0.35); overflow: hidden;
        }
        .dc-scanner-laser {
          position: absolute; left: 6%; right: 6%; top: 50%; height: 2px; background: #ef4444;
          box-shadow: 0 0 8px #ef4444; animation: dc-laser 1.6s ease-in-out infinite alternate;
        }
        @keyframes dc-laser { from { top: 20%; } to { top: 80%; } }
        .dc-scanner-torch {
          position: absolute; right: 10px; bottom: 10px; width: 40px; height: 40px; border-radius: 50%;
          border: none; background: rgba(0, 0, 0, 0.55); color: #fff; display: grid; place-items: center; cursor: pointer;
        }
        .dc-scanner-msg {
          position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 10px; color: #cbd0e6; font-size: 0.88rem; text-align: center; padding: 20px;
        }
        .dc-scanner-msg p { margin: 0; max-width: 280px; }
      `}</style>
    </div>
  );
}
