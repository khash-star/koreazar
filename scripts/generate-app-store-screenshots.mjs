#!/usr/bin/env node
/**
 * App Store Connect screenshots – iPhone 6.5" Display.
 * Source: mobile/screenshots-source/*.png
 * Output: mobile/app-store-screenshots/
 *
 * Sizes: 1242×2688 (portrait), 2688×1242 (landscape)
 * Run: npm run generate-app-store-screenshots
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceDir = path.join(root, "mobile", "screenshots-source");
const outDir = path.join(root, "mobile", "app-store-screenshots");

const SIZES = [
  { w: 1242, h: 2688, name: "6.5-portrait" },
  { w: 2688, h: 1242, name: "6.5-landscape" },
];

if (!fs.existsSync(sourceDir)) {
  fs.mkdirSync(sourceDir, { recursive: true });
  fs.writeFileSync(
    path.join(sourceDir, "README.txt"),
    "Put your app screenshots here (PNG/JPG).\nRun: npm run generate-app-store-screenshots\n"
  );
  console.log("Created", sourceDir, "- add your screenshots there, then run this script again.");
  process.exit(0);
}

const files = fs.readdirSync(sourceDir).filter((f) => /\.(png|jpg|jpeg)$/i.test(f));
if (files.length === 0) {
  console.log("No images in", sourceDir);
  console.log("Add PNG/JPG screenshots, then run: npm run generate-app-store-screenshots");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const base = path.basename(file, path.extname(file));
  const srcPath = path.join(sourceDir, file);

  for (const { w, h, name } of SIZES) {
    const outPath = path.join(outDir, `${base}_${name}_${w}x${h}.png`);
    await sharp(srcPath)
      .resize(w, h, { fit: "cover", position: "center" })
      .png()
      .toFile(outPath);
    console.log("Created", path.relative(root, outPath));
  }
}

console.log("\nDone. Upload from mobile/app-store-screenshots/ to App Store Connect.");
