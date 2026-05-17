const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputPath = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

async function generateIcons() {
  console.log('Generating PWA icons...');

  // Read the SVG file
  const svgBuffer = fs.readFileSync(inputPath);

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`Error generating ${size}x${size}:`, error.message);
    }
  }

  // Generate favicon.ico (using 32x32)
  const faviconPath = path.join(__dirname, '../public/favicon.ico');
  try {
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));

    // Copy as favicon (browsers accept PNG as favicon)
    fs.copyFileSync(faviconPath.replace('.ico', '.png'), faviconPath);
    console.log('Generated: favicon.ico');
  } catch (error) {
    console.error('Error generating favicon:', error.message);
  }

  console.log('Done!');
}

generateIcons().catch(console.error);
