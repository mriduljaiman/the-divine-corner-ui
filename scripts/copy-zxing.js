// Copies the ZXing WebAssembly decoder into public/zxing/<version>/ so the admin scanner
// loads it from our own domain (no third-party CDN) and it can be cached forever.
// Runs automatically before `next build` / `next dev` (see package.json).
const fs = require('fs');
const path = require('path');

const pkgDir = path.join(__dirname, '..', 'node_modules', 'zxing-wasm');
const { version } = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
const src = path.join(pkgDir, 'dist', 'reader', 'zxing_reader.wasm');
const outDir = path.join(__dirname, '..', 'public', 'zxing', version);

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(src, path.join(outDir, 'zxing_reader.wasm'));
fs.writeFileSync(path.join(__dirname, '..', 'src', 'utils', 'zxingVersion.json'), JSON.stringify({ version }) + '\n');
console.log(`zxing-wasm ${version} -> public/zxing/${version}/zxing_reader.wasm`);
