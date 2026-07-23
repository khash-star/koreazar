#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const serviceSource = readFileSync(
  join(root, "mobile/src/services/listingService.js"),
  "utf8"
);
const listingCountrySource = readFileSync(
  join(root, "mobile/src/utils/listingCountry.js"),
  "utf8"
);
const listingCountryModule = await import(
  `data:text/javascript;base64,${Buffer.from(listingCountrySource).toString("base64")}`
);
const { filterListingsForMarket } = listingCountryModule;

const rows = [
  { id: "kr", country_code: "KR" },
  { id: "legacy-kr", country_code: null },
  { id: "us", country_code: "US", region_code: "washington-dc" },
  { id: "us-other-region", country_code: "US", region_code: "new-york" },
  { id: "jp", country_code: "JP" },
  { id: "mistagged", country_code: "KR", region_code: "washington-dc" },
];

assert.deepEqual(
  filterListingsForMarket(rows, "KR").map(({ id }) => id),
  ["kr", "legacy-kr"],
  "KR My Listings must exclude foreign and regional rows"
);
assert.deepEqual(
  filterListingsForMarket(rows, "US", "washington-dc").map(({ id }) => id),
  ["us"],
  "US My Listings must exclude non-US and out-of-region rows"
);

function replaceRequired(source, search, replacement) {
  assert.ok(source.includes(search), `Expected import not found: ${search}`);
  return source.replace(search, replacement);
}

async function loadListingServiceForMarket(countryCode, regionCode, legacyFallback) {
  let source = serviceSource;
  source = replaceRequired(
    source,
    'import { auth } from "../config/firebase";',
    'const auth = { currentUser: { uid: "uid-1" } };'
  );
  source = replaceRequired(
    source,
    'import { getActiveMobileCountryCode, isUsMobileMarket } from "../config/country";',
    `const getActiveMobileCountryCode = () => ${JSON.stringify(countryCode)};
const isUsMobileMarket = () => getActiveMobileCountryCode() === "US";`
  );
  source = replaceRequired(
    source,
    'import { getActiveMobileRegionCode } from "../config/region.js";',
    `const getActiveMobileRegionCode = () => ${JSON.stringify(regionCode || null)};`
  );
  source = replaceRequired(
    source,
    'import { toDate } from "../utils/firestoreDates";',
    "const toDate = () => null;"
  );
  source = replaceRequired(
    source,
    'import { buildApiUrl, requestJson } from "./apiClient";',
    `const capturedRequests = [];
const mockRows = ${JSON.stringify(rows)};
const useLegacyFallback = ${JSON.stringify(Boolean(legacyFallback))};
const buildApiUrl = (action, params) => ({ action, params });
const requestJson = async (url) => {
  capturedRequests.push(url);
  if (useLegacyFallback && url.params.status === "all") return { data: [] };
  return { data: mockRows };
};`
  );
  source = replaceRequired(
    source,
    'import { filterListingsForMarket } from "../utils/listingCountry";',
    listingCountrySource.replace(/^export /gm, "")
  );
  source += "\nexport { capturedRequests as __capturedRequests };\n";

  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

async function assertMyListingsScope(countryCode, regionCode, expectedIds, legacyFallback = false) {
  const service = await loadListingServiceForMarket(countryCode, regionCode, legacyFallback);
  const result = await service.getMyListings("owner@example.com", 42, 20, {
    firebaseUid: "uid-1",
  });

  assert.deepEqual(
    result.map(({ id }) => id),
    expectedIds,
    `${countryCode} My Listings returned rows outside its market`
  );
  const requestsPerIdentity = legacyFallback ? 4 : 1;
  assert.equal(
    service.__capturedRequests.length,
    requestsPerIdentity * 3,
    "all owner identity queries must run"
  );

  const expectedIdentities = [
    ["firebase_uid", "uid-1"],
    ["customer_id", "42"],
    ["created_by", "owner@example.com"],
  ];
  service.__capturedRequests.forEach(({ action, params }, index) => {
    const identityIndex = Math.floor(index / requestsPerIdentity);
    assert.equal(action, "listings");
    assert.equal(params.country_code, countryCode);
    assert.equal(
      params[expectedIdentities[identityIndex][0]],
      expectedIdentities[identityIndex][1]
    );
    if (regionCode) {
      assert.equal(params.region_code, regionCode);
    } else {
      assert.equal("region_code" in params, false);
    }
  });
}

await assertMyListingsScope("US", "washington-dc", ["us"]);
await assertMyListingsScope("KR", null, ["kr", "legacy-kr"]);
await assertMyListingsScope("US", "washington-dc", ["us"], true);

console.log("OK: mobile My Listings queries and fallbacks are market-scoped");
