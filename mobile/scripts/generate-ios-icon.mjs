/**
 * App Store–д зориулсан 1024×1024 PNG (alpha байвал цагаан дэвсгэр дээр наана).
 * Ажиллуулах: koreazar-repo root-оос: node mobile/scripts/generate-ios-icon.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "assets", "icon.png");
const out = path.join(root, "assets", "icon-ios-1024.png");

await sharp(src)
  .resize(1024, 1024, { fit: "cover", position: "centre" })
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .png({ compressionLevel: 9 })
  .toFile(out);

console.log("Wrote", out);
