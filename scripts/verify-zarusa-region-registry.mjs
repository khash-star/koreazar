#!/usr/bin/env node
/**
 * Verify US region registry parity across web, mobile, and PHP.
 * Run: node scripts/verify-zarusa-region-registry.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

function parseJsRegions(source, label) {
  const regions = {};
  const blockRe = /['"]?([\w-]+)['"]?\s*:\s*\{[^}]*active:\s*(true|false)[^}]*stateCodes:\s*\[([^\]]*)\]/gs;
  let m;
  while ((m = blockRe.exec(source))) {
    const code = m[1];
    const active = m[2] === "true";
    const states = [...m[3].matchAll(/['"]([A-Z]{2})['"]/g)].map((x) => x[1]).sort();
    regions[code] = { active, stateCodes: states };
  }
  if (Object.keys(regions).length === 0) {
    throw new Error(`${label}: no regions parsed`);
  }
  return regions;
}

function parsePhpRegions(source) {
  const regions = {};
  const entryRe =
    /'([\w-]+)'\s*=>\s*\[\s*'active'\s*=>\s*(true|false)\s*,\s*'state_codes'\s*=>\s*\[([^\]]*)\]\s*,?\s*\]/gs;
  let m;
  while ((m = entryRe.exec(source))) {
    const code = m[1];
    const active = m[2] === "true";
    const states = [...m[3].matchAll(/'([A-Z]{2})'/g)].map((x) => x[1]).sort();
    regions[code] = { active, stateCodes: states };
  }
  if (Object.keys(regions).length === 0) {
    throw new Error("PHP: no regions parsed");
  }
  return regions;
}

function diffRegions(a, b, aLabel, bLabel) {
  const errors = [];
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of [...keys].sort()) {
    if (!a[key]) errors.push(`Missing in ${aLabel}: ${key}`);
    if (!b[key]) errors.push(`Missing in ${bLabel}: ${key}`);
    if (a[key] && b[key]) {
      if (a[key].active !== b[key].active) {
        errors.push(`${key}: active mismatch (${aLabel}=${a[key].active}, ${bLabel}=${b[key].active})`);
      }
      const sa = a[key].stateCodes.join(",");
      const sb = b[key].stateCodes.join(",");
      if (sa !== sb) errors.push(`${key}: stateCodes mismatch (${aLabel}=[${sa}] ${bLabel}=[${sb}])`);
    }
  }
  return errors;
}

const web = parseJsRegions(read("src/config/regions/us.js"), "web");
const mobile = parseJsRegions(read("mobile/src/config/regions/us.js"), "mobile");
const php = parsePhpRegions(read("api/regions.php"));

const active = Object.entries(web).filter(([, v]) => v.active).map(([k]) => k);
if (active.length !== 1 || active[0] !== "washington-dc") {
  console.error("FAIL: expected only washington-dc active, got:", active);
  process.exit(1);
}

const errors = [
  ...diffRegions(web, mobile, "web", "mobile"),
  ...diffRegions(web, php, "web", "php"),
];

if (errors.length) {
  console.error("Registry parity FAILED:");
  errors.forEach((e) => console.error(" -", e));
  process.exit(1);
}

console.log("OK: region registry in sync (web / mobile / php)");
console.log("OK: only washington-dc active");
console.log("Regions:", Object.keys(web).join(", "));
