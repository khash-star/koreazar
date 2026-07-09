/**
 * Copies src/constants/adminRoles.js → mobile/src/constants/adminRoles.js
 * Run: npm run sync-admin-roles
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcPath = path.join(root, 'src', 'constants', 'adminRoles.js');
const destPath = path.join(root, 'mobile', 'src', 'constants', 'adminRoles.js');

if (!fs.existsSync(srcPath)) {
  console.error('Missing source:', srcPath);
  process.exit(1);
}

const webRaw = fs.readFileSync(srcPath, 'utf8');
const body = webRaw.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, '');

const mobileHeader = `/**
 * AUTO-GENERATED – do not edit by hand.
 * Source: src/constants/adminRoles.js
 * Regenerate: npm run sync-admin-roles (from repo root)
 */

`;

fs.writeFileSync(destPath, mobileHeader + body, 'utf8');
console.log('Synced adminRoles →', path.relative(root, destPath));
