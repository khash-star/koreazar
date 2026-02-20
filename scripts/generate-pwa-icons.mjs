#!/usr/bin/env node
/**
 * icon-180.png → PNG icons (192, 512) for PWA
 * iOS apple-touch-icon, Android/Chrome manifest — бүх platform төгс
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const sourcePath = path.join(publicDir, 'icon-180.png');
const sizes = [192, 512];

if (!fs.existsSync(sourcePath)) {
  console.error(`Source icon not found: ${sourcePath}`);
  process.exit(1);
}

const sourceImage = fs.readFileSync(sourcePath);
for (const size of sizes) {
  const outPath = path.join(publicDir, `icon-${size}.png`);
  await sharp(sourceImage).resize(size, size).png().toFile(outPath);
  console.log(`Generated ${outPath}`);
}

console.log('Note: icon-180.png is used as-is (already correct size)');
