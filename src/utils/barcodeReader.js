// One shared barcode detector for the admin scanner.
// - Phones with a built-in BarcodeDetector (Android Chrome) use it: fastest, no download.
// - Everything else (iPhone Safari, desktop) uses ZXing compiled to WebAssembly, served from
//   our own domain. It is fetched and compiled in the background when the admin panel opens,
//   so the camera never waits for it.
// Our labels are Code128 only, and a live camera gives a new frame every few ms, so each frame
// is decoded in "fast" mode (no try-harder / rotate / invert, stop at the first symbol).
import zxing from './zxingVersion.json';

const ZXING_OPTIONS = {
  formats: ['Code128'],
  tryHarder: false,
  tryRotate: false,
  tryInvert: false,
  tryDownscale: false,
  maxNumberOfSymbols: 1,
};

let detectorPromise = null;

async function nativeDetector() {
  if (typeof window === 'undefined' || !('BarcodeDetector' in window)) return null;
  try {
    const supported = await window.BarcodeDetector.getSupportedFormats();
    if (!supported.includes('code_128')) return null;
    const native = new window.BarcodeDetector({ formats: ['code_128'] });
    return { kind: 'native', detect: (canvas) => native.detect(canvas) };
  } catch {
    return null;
  }
}

async function wasmDetector() {
  const { prepareZXingModule, readBarcodes } = await import('zxing-wasm/reader');
  await prepareZXingModule({
    overrides: {
      locateFile: (file, prefix) => (file.endsWith('.wasm') ? `/zxing/${zxing.version}/${file}` : prefix + file),
    },
    fireImmediately: true,
  });
  return {
    kind: 'wasm',
    async detect(canvas) {
      const img = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
      const results = await readBarcodes(img, ZXING_OPTIONS);
      return results.filter(r => r.isValid && r.text).map(r => ({ rawValue: r.text, format: r.format }));
    },
  };
}

/** Resolves to { kind, detect(canvas) -> Promise<[{ rawValue }]> }. */
export function loadDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => (await nativeDetector()) || wasmDetector())();
    detectorPromise.catch(() => { detectorPromise = null; }); // allow a retry after a network error
  }
  return detectorPromise;
}

/** Warm the decoder up while the browser is idle (admin pages only). */
export function preloadDetector() {
  if (typeof window === 'undefined' || detectorPromise) return;
  const start = () => loadDetector().catch(() => {});
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 3000 });
  else setTimeout(start, 1500);
}
