#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { filterListingsForMarket } from "../mobile/src/utils/listingCountry.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const serviceSource = readFileSync(
  join(root, "mobile/src/services/listingService.js"),
  "utf8"
);

const myListingsStart = serviceSource.indexOf("export async function getMyListings");
const myListingsEnd = serviceSource.indexOf("\n/**", myListingsStart);
assert.ok(myListingsStart >= 0 && myListingsEnd > myListingsStart, "getMyListings not found");

const myListingsSource = serviceSource.slice(myListingsStart, myListingsEnd);
assert.match(
  myListingsSource,
  /const marketScope = buildMarketListingsParams\(\);/,
  "My Listings must resolve the active mobile market"
);

for (const identityField of ["firebase_uid", "customer_id", "created_by"]) {
  assert.match(
    myListingsSource,
    new RegExp(`\\{ \\.\\.\\.marketScope, ${identityField}:`),
    `My Listings ${identityField} query must include the active market`
  );
}

const allStatusStart = serviceSource.indexOf("async function requestListingsQuery");
const allStatusEnd = serviceSource.indexOf(
  "\nexport async function getListingsByCreator",
  allStatusStart
);
const allStatusSource = serviceSource.slice(allStatusStart, allStatusEnd);
assert.ok(
  allStatusSource
    .match(/filterListingsForMarket\(rows, params\.country_code, params\.region_code\)/g)
    ?.length >= 1,
  "status=all responses must be filtered to the requested market"
);
assert.match(
  allStatusSource,
  /filterListingsForMarket\(merged, params\.country_code, params\.region_code\)/,
  "legacy multi-status responses must be filtered to the requested market"
);

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

console.log("OK: mobile My Listings queries and fallbacks are market-scoped");
