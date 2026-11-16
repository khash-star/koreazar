/**
 * Mobile edit used to load MySQL DECIMAL strings with a non-digit strip.
 * "15000.00" became "1500000", and saving the form wrote 100× the price.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

const sourceUrl = new URL("../mobile/src/utils/priceDigits.js", import.meta.url);
const source = fs.readFileSync(sourceUrl, "utf8");
const { priceToInputDigits } = await import(
  `data:text/javascript,${encodeURIComponent(source)}`
);

function legacyDigitStrip(price) {
  return String(price ?? "").replace(/\D/g, "");
}

test("DECIMAL scale is not appended as extra digits", () => {
  assert.equal(legacyDigitStrip("15000.00"), "1500000");
  assert.equal(priceToInputDigits("15000.00"), "15000");
  assert.equal(priceToInputDigits("50.00"), "50");
  assert.equal(priceToInputDigits("5000000.00"), "5000000");
  assert.equal(priceToInputDigits("15000.50"), "15000");
});

test("numeric and grouped prices stay whole currency units", () => {
  assert.equal(priceToInputDigits(15000), "15000");
  assert.equal(priceToInputDigits("15,000.00"), "15000");
  assert.equal(priceToInputDigits("0.00"), "0");
  assert.equal(priceToInputDigits(0), "0");
});

test("empty and non-numeric values do not throw", () => {
  assert.equal(priceToInputDigits(null), "");
  assert.equal(priceToInputDigits(undefined), "");
  assert.equal(priceToInputDigits(""), "");
  assert.equal(priceToInputDigits("  "), "");
  assert.equal(priceToInputDigits("abc"), "");
});
