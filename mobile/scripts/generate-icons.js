/**
 * Generate all app icon assets from a source 1024x1024 image.
 * Run: node scripts/generate-icons.js <source-image>
 */
const fs = require("fs");
const path = require("path");

const SOURCE = process.argv[2] || path.join(__dirname, "../assets/icon-source.png");
const ASSETS = path.join(__dirname, "../assets");

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.log("Installing sharp...");
    require("child_process").execSync("npm install sharp --no-save", {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
    sharp = require("sharp");
  }

  if (!fs.existsSync(SOURCE)) {
    console.error("Source image not found:", SOURCE);
    process.exit(1);
  }

  const img = sharp(SOURCE);
  const meta = await img.metadata();
  console.log("Source:", SOURCE, `(${meta.width}x${meta.height})`);

  // 1024x1024 for main assets
  await img.clone().resize(1024, 1024).png().toFile(path.join(ASSETS, "icon.png"));
  console.log("Created icon.png (1024x1024)");

  await img.clone().resize(1024, 1024).png().toFile(path.join(ASSETS, "android-icon-foreground.png"));
  console.log("Created android-icon-foreground.png (1024x1024)");

  await img.clone().resize(1024, 1024).png().toFile(path.join(ASSETS, "splash-icon.png"));
  console.log("Created splash-icon.png (1024x1024)");

  // Solid background for adaptive icon (#E6F4FE)
  const [r, g, b] = [0xe6, 0xf4, 0xfe];
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 3,
      background: { r, g, b },
    },
  })
    .png()
    .toFile(path.join(ASSETS, "android-icon-background.png"));
  console.log("Created android-icon-background.png (1024x1024, solid)");

  // Monochrome: grayscale version for themed icons
  await img
    .clone()
    .resize(1024, 1024)
    .grayscale()
    .png()
    .toFile(path.join(ASSETS, "android-icon-monochrome.png"));
  console.log("Created android-icon-monochrome.png (1024x1024, grayscale)");

  // Favicon 48x48
  await img.clone().resize(48, 48).png().toFile(path.join(ASSETS, "favicon.png"));
  console.log("Created favicon.png (48x48)");

  console.log("\nDone. All assets saved to", ASSETS);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
