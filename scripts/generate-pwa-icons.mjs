#!/usr/bin/env node
/**
 * PWA icons: icon-180.png → 192, 512.
 * If icon-180.png missing, creates placeholder (amber #ea580c) then generates.
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const sourcePath = path.join(publicDir, 'icon-180.png');
const sizes = [180, 192, 512];

async function ensureSource() {
  if (fs.existsSync(sourcePath)) return fs.readFileSync(sourcePath);
  console.warn(`Source not found: ${sourcePath}. Creating placeholder.`);
  const placeholder = await sharp({
    create: {
      width: 180,
      height: 180,
      channels: 3,
      background: { r: 234, g: 88, b: 12 },
    },
  })
    .png()
    .toBuffer();
  fs.writeFileSync(sourcePath, placeholder);
  return placeholder;
}

const sourceImage = await ensureSource();
for (const size of sizes) {
  const outPath = path.join(publicDir, `icon-${size}.png`);
  await sharp(sourceImage).resize(size, size).png().toFile(outPath);
  console.log(`Generated ${outPath}`);
}
