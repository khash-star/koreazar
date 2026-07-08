#!/usr/bin/env node
/**
 * Seed + verify Zarusa DMV test listings on production API.
 * Requires FTP creds in scripts/deploy-zarusa-api.local.env (or env vars).
 *
 * Env overrides:
 *   ZARUSA_FTP_HOST, ZARUSA_FTP_USER, ZARUSA_FTP_PASSWORD, ZARUSA_FTP_REMOTE_DIR
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const API_BASE = process.env.API_BASE_URL || "https://api.zarkorea.com/index.php";
const ENV_FILE = path.join(ROOT, "scripts", "deploy-zarusa-api.local.env");
const SEED_NAME = "_seed_zarusa_dmv_test_once.php";

function loadEnvFile() {
  const out = {};
  if (!fs.existsSync(ENV_FILE)) return out;
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function cfg() {
  const f = loadEnvFile();
  return {
    host: process.env.ZARUSA_FTP_HOST || f.ZARUSA_DEPLOY_HOST || "43.231.112.109",
    user: process.env.ZARUSA_FTP_USER || f.ZARUSA_DEPLOY_USER || "",
    pass: process.env.ZARUSA_FTP_PASSWORD || f.ZARUSA_DEPLOY_PASSWORD || "",
    remoteDir: (process.env.ZARUSA_FTP_REMOTE_DIR || f.ZARUSA_DEPLOY_REMOTE_DIR || "/public_html/api").replace(
      /^\/+/,
      ""
    ),
  };
}

function buildUrl(action, params = {}) {
  const url = new URL(API_BASE);
  url.searchParams.set("action", action);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

function curl(args) {
  const r = spawnSync("curl.exe", args, { encoding: "utf8" });
  return { code: r.status ?? 1, out: (r.stdout || "") + (r.stderr || "") };
}

function makeSeedPhp(token) {
  return `<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
$expected = '${token}';
if (!hash_equals($expected, (string)($_GET['token'] ?? ''))) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'forbidden']);
    exit;
}
require __DIR__ . '/bootstrap.php';
$pdo = db();
$uid = 'zarusa-dmv-seed';
$email = 'zarusa-dmv-seed@zarkorea.internal';
$rows = [
    ['title' => 'DMV Test — DC Metro Bike', 'category' => 'vehicles', 'subcategory' => 'bicycle', 'state' => 'DC', 'price' => 120],
    ['title' => 'DMV Test — Arlington Sofa', 'category' => 'furniture', 'subcategory' => 'sofa', 'state' => 'VA', 'price' => 80],
    ['title' => 'DMV Test — Bethesda Room Rental', 'category' => 'real_estate', 'subcategory' => 'rent', 'state' => 'MD', 'price' => 950],
    ['title' => 'DMV Test — Free Moving Boxes', 'category' => 'free', 'subcategory' => 'give', 'state' => 'DC', 'price' => 0],
];
$inserted = [];
$updated = [];
try {
    $pdo->beginTransaction();
    $backfill = $pdo->exec("UPDATE listings SET region_code = 'washington-dc', state_code = 'DC'
        WHERE country_code = 'US' AND (region_code IS NULL OR region_code = '')");
    $updated['backfilled_us_rows'] = (int)$backfill;
    $stmt = $pdo->prepare('INSERT INTO listings (
        firebase_uid, created_by, category, subcategory, title, description, price, is_negotiable,
        \`condition\`, status, listing_type, country_code, state_code, region_code, phone, views, images
    ) VALUES (
        :firebase_uid, :created_by, :category, :subcategory, :title, :description, :price, 1,
        :cond, :status, :listing_type, :country_code, :state_code, :region_code, :phone, 0, :images
    )');
    foreach ($rows as $row) {
        $stmt->execute([
            ':firebase_uid' => $uid,
            ':created_by' => $email,
            ':category' => $row['category'],
            ':subcategory' => $row['subcategory'],
            ':title' => $row['title'],
            ':description' => 'Zarusa Washington DC / DMV MVP test listing (safe to delete).',
            ':price' => $row['price'],
            ':cond' => 'used',
            ':status' => 'active',
            ':listing_type' => 'regular',
            ':country_code' => 'US',
            ':state_code' => $row['state'],
            ':region_code' => 'washington-dc',
            ':phone' => '2025550100',
            ':images' => '[]',
        ]);
        $inserted[] = (int)$pdo->lastInsertId();
    }
    $pdo->commit();
    echo json_encode(['ok' => true, 'inserted_ids' => $inserted, 'updated' => $updated]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
`;
}

async function verify() {
  console.log("\n=== Verify US DMV listings ===\n");
  const us = await fetch(buildUrl("listings", { country_code: "US", limit: 20 }));
  const body = await us.json();
  const rows = body?.data || [];
  console.log(`US listings returned: ${rows.length}`);
  for (const r of rows) {
    console.log(
      `  id=${r.id} region=${r.region_code ?? "null"} state=${r.state_code ?? "-"} title=${String(r.title).slice(0, 40)}`
    );
  }
  const bad = rows.filter((r) => r.region_code && r.region_code !== "washington-dc");
  const missing = rows.filter((r) => !r.region_code);
  if (bad.length) console.error(`FAIL: ${bad.length} row(s) outside washington-dc`);
  else console.log("OK: all visible US rows are washington-dc scoped");
  if (missing.length) console.warn(`WARN: ${missing.length} row(s) missing region_code`);
  const chicago = await fetch(buildUrl("listings", { country_code: "US", region_code: "chicago", limit: 5 }));
  const ch = await chicago.json();
  console.log(`chicago filter count: ${(ch?.data || []).length} (expect 0)`);
  return rows.length >= 3 && bad.length === 0 && (ch?.data || []).length === 0;
}

async function main() {
  const { host, user, pass, remoteDir } = cfg();
  if (!user || !pass) {
    console.error("Missing FTP credentials. Set scripts/deploy-zarusa-api.local.env or ZARUSA_FTP_* env vars.");
    process.exit(1);
  }
  const token = crypto.randomUUID().replace(/-/g, "");
  const localSeed = path.join(ROOT, "deploy", "zarusa-api-upload", SEED_NAME);
  fs.mkdirSync(path.dirname(localSeed), { recursive: true });
  fs.writeFileSync(localSeed, makeSeedPhp(token), "utf8");

  const ftpBase = `ftp://${host}/${remoteDir}`;
  const auth = `${user}:${pass}`;

  console.log("Uploading seed script...");
  let r = curl(["-s", "-T", localSeed, "--user", auth, `${ftpBase}/${SEED_NAME}`]);
  if (r.code !== 0) {
    console.error(r.out);
    process.exit(1);
  }

  console.log("Running seed...");
  r = curl(["-s", "--max-time", "30", `https://api.zarkorea.com/${SEED_NAME}?token=${token}`]);
  console.log(r.out.trim());

  console.log("Removing seed script...");
  curl(["-s", "--user", auth, "-Q", `CWD ${remoteDir}`, "-Q", `DELE ${SEED_NAME}`, `ftp://${host}/`]);
  fs.unlinkSync(localSeed);

  const ok = await verify();
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
