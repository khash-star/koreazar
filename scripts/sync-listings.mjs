/**
 * Copies src/constants/listings.js → mobile/src/constants/listings.js
 * (EAS Build only includes mobile/, so mobile keeps a generated copy.)
 *
 * Run: npm run sync-listings
 * After editing categories/locations, run this before EAS build or commit.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcPath = path.join(root, 'src', 'constants', 'listings.js');
const destPath = path.join(root, 'mobile', 'src', 'constants', 'listings.js');

if (!fs.existsSync(srcPath)) {
  console.error('Missing source:', srcPath);
  process.exit(1);
}

const webRaw = fs.readFileSync(srcPath, 'utf8');
// Drop first /** ... */ block (web header); keep exports body identical
const body = webRaw.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, '');

const mobileHeader = `/**
 * AUTO-GENERATED – do not edit by hand.
 * Source: src/constants/listings.js
 * Regenerate: npm run sync-listings (from repo root)
 */

`;

fs.writeFileSync(destPath, mobileHeader + body, 'utf8');
console.log('Synced listings →', path.relative(root, destPath));
