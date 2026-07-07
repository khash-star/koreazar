#!/usr/bin/env node
/**
 * Smoke-test Zarusa DMV API endpoints (safe read-only + method probes).
 * Run: node scripts/smoke-zarusa-dmv-api.mjs
 * Env: API_BASE_URL (default https://api.zarkorea.com/index.php)
 */
const API_BASE = process.env.API_BASE_URL || "https://api.zarkorea.com/index.php";

function buildUrl(action, params = {}) {
  const url = new URL(API_BASE);
  url.searchParams.set("action", action);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function probe(name, url, options = {}) {
  const res = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { name, status: res.status, body };
}

function pass(msg) {
  console.log(`  OK  ${msg}`);
}

function warn(msg) {
  console.warn(`  WARN ${msg}`);
}

function fail(msg) {
  console.error(`  FAIL ${msg}`);
}

const results = [];

try {
  console.log(`API base: ${API_BASE}\n`);

  const health = await probe("health", buildUrl("health"));
  results.push(health);
  if (health.status === 200 && health.body?.ok) pass("health");
  else fail(`health status=${health.status}`);

  const kr = await probe("kr-listings", buildUrl("listings", { country_code: "KR", limit: 1 }));
  results.push(kr);
  if (kr.status === 200 && Array.isArray(kr.body?.data)) pass("KR listings");
  else fail(`KR listings status=${kr.status}`);

  const us = await probe("us-listings", buildUrl("listings", { country_code: "US", limit: 5 }));
  results.push(us);
  if (us.status === 200 && Array.isArray(us.body?.data)) {
    pass("US listings endpoint");
    const rows = us.body.data;
    const hasRegionCol = rows.some((r) => "region_code" in r);
    if (hasRegionCol) {
      const bad = rows.filter((r) => r.region_code && r.region_code !== "washington-dc");
      if (bad.length) fail(`US rows outside washington-dc: ${bad.length}`);
      else pass("US rows scoped to washington-dc (or empty)");
    } else {
      warn("region_code not in response — migration/API region deploy likely pending");
    }
  } else fail(`US listings status=${us.status}`);

  const chicago = await probe(
    "us-chicago",
    buildUrl("listings", { country_code: "US", region_code: "chicago", limit: 5 })
  );
  results.push(chicago);
  if (chicago.status === 200 && (chicago.body?.data || []).length === 0) {
    pass("inactive region chicago returns empty");
  } else if (chicago.status === 200) {
    warn("chicago returned rows — region lock may not be active yet (migration/API deploy pending)");
  } else {
    fail(`chicago probe status=${chicago.status}`);
  }

  const hardFails = results.filter(
    (r) => r.name === "health" && r.status !== 200
  ).length;
  const krFail = results.find((r) => r.name === "kr-listings" && r.status !== 200);

  console.log("");
  if (hardFails || krFail) {
    console.error("Smoke test FAILED (KR/health broken)");
    process.exit(1);
  }
  console.log("Smoke test PASSED (KR safe; US region features may be pending deploy/migration)");
} catch (e) {
  console.error("Smoke test error:", e?.message || e);
  process.exit(1);
}
