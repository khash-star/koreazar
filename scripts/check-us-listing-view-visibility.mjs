#!/usr/bin/env node
/**
 * Guard: unauthenticated listing view increment must use the same US-region
 * 404 gate as GET by id. Prevents sequential-id PATCH {"views": n+1} from
 * returning seller PII for region-hidden US listings.
 *
 * Run: node scripts/check-us-listing-view-visibility.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

const indexPhp = read("api/index.php");
const regionsPhp = read("api/regions.php");

const listingCase = indexPhp.match(/case 'listing':([\s\S]*?)case 'user_sync':/);
if (!listingCase) {
  fail("Could not locate action=listing handler in api/index.php");
} else {
  const listingHandler = listingCase[1];
  const getBlock = listingHandler.match(/if \(\$method === 'GET'\) \{([\s\S]*?)if \(\$method === 'PUT' \|\| \$method === 'PATCH'\)/);
  const patchBlock = listingHandler.match(/if \(\$method === 'PUT' \|\| \$method === 'PATCH'\) \{([\s\S]*?)if \(\$method === 'DELETE'\)/);

  if (!getBlock) {
    fail("Could not locate listing GET handler");
  } else if (!getBlock[1].includes("enforce_us_listing_row_visible($pdo, $row)")) {
    fail("GET ?action=listing must call enforce_us_listing_row_visible");
  }

  if (!patchBlock) {
    fail("Could not locate listing PATCH handler");
  } else {
    const patch = patchBlock[1];
    if (!patch.includes("$isPublicViewIncrement")) {
      fail("PATCH must distinguish public view increment from authenticated writes");
    }
    if (!/else \{\s*\/\/[^\n]*\n\s*enforce_us_listing_row_visible\(\$pdo, \$existing\);/.test(patch)) {
      fail("Public view increment must call enforce_us_listing_row_visible before UPDATE");
    }
    const incrementGate = patch.match(
      /\$isPublicViewIncrement = \$isViewOnlyPayload && \$requestedViews === \$existingViews \+ 1;/
    );
    if (!incrementGate) {
      fail("Public view increment must require views === existing + 1");
    }
  }
}

if (!regionsPhp.includes("function listing_is_us_region_visible(")) {
  fail("listing_is_us_region_visible helper is missing");
}
if (!regionsPhp.includes("function enforce_us_listing_row_visible(")) {
  fail("enforce_us_listing_row_visible helper is missing");
}

const US_REGIONS = {
  "washington-dc": { active: true },
  chicago: { active: false },
  "new-york": { active: false },
};

function normalizeCountry(code) {
  const normalized = String(code || "KR").trim().toUpperCase();
  return ["KR", "US", "JP"].includes(normalized) ? normalized : "KR";
}

function normalizeRegion(code) {
  const normalized = String(code || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(US_REGIONS, normalized) ? normalized : "";
}

function listingIsUsRegionVisible(row, { hasRegionColumn = true } = {}) {
  if (!hasRegionColumn) return true;
  if (normalizeCountry(row.country_code) !== "US") return true;
  const region = normalizeRegion(row.region_code);
  const defaultRegion = "washington-dc";
  return region !== "" && US_REGIONS[region]?.active === true && region === defaultRegion;
}

const cases = [
  { row: { country_code: "US", region_code: "washington-dc" }, visible: true, label: "active DC US listing" },
  { row: { country_code: "US", region_code: "chicago" }, visible: false, label: "inactive Chicago US listing" },
  { row: { country_code: "US", region_code: "" }, visible: false, label: "US listing with empty region" },
  { row: { country_code: "US", region_code: null }, visible: false, label: "US listing with null region" },
  { row: { country_code: "KR", region_code: "" }, visible: true, label: "KR listing" },
  { row: { country_code: "KR", region_code: "washington-dc" }, visible: true, label: "KR listing even with region" },
  { row: { country_code: "US", region_code: "washington-dc" }, visible: true, hasRegionColumn: false, label: "legacy schema without region_code" },
];

for (const testCase of cases) {
  const actual = listingIsUsRegionVisible(testCase.row, {
    hasRegionColumn: testCase.hasRegionColumn,
  });
  if (actual !== testCase.visible) {
    fail(`${testCase.label}: expected visible=${testCase.visible}, got ${actual}`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("ok: public view increment uses the same US-region 404 gate as GET");
