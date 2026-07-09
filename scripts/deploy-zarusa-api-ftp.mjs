#!/usr/bin/env node
/**
 * Deploy api/index.php + api/regions.php via FTP (cPanel).
 * Optional: run admin RBAC MySQL migration via one-time PHP runner.
 *
 * Credentials: scripts/deploy-zarusa-api.local.env or ZARUSA_FTP_* env vars.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENV_FILE = path.join(ROOT, "scripts", "deploy-zarusa-api.local.env");
const BUNDLE_DIR = path.join(ROOT, "deploy", "zarusa-api-upload");
const RUNNER_NAME = "_deploy_zarusa_rbac_once.php";
const BAMBAR_UID = "vMIyCHzcexQpJHC8XrJGeZ1VMZn1";

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
    host: process.env.ZARUSA_FTP_HOST || f.ZARUSA_FTP_HOST || f.ZARUSA_DEPLOY_HOST || "43.231.112.109",
    user: process.env.ZARUSA_FTP_USER || f.ZARUSA_FTP_USER || f.ZARUSA_DEPLOY_USER || "",
    pass: process.env.ZARUSA_FTP_PASSWORD || f.ZARUSA_FTP_PASSWORD || f.ZARUSA_DEPLOY_PASSWORD || "",
    remoteDir: (process.env.ZARUSA_FTP_REMOTE_DIR || f.ZARUSA_FTP_REMOTE_DIR || f.ZARUSA_DEPLOY_REMOTE_DIR || "public_html/api").replace(
      /^\/+/,
      ""
    ),
    skipMigration: process.env.ZARUSA_SKIP_MIGRATION === "1",
  };
}

function curl(args) {
  const r = spawnSync("curl.exe", args, { encoding: "utf8" });
  return { code: r.status ?? 1, out: (r.stdout || "") + (r.stderr || "") };
}

function packageBundle() {
  const r = spawnSync(
    "powershell.exe",
    ["-ExecutionPolicy", "Bypass", "-File", path.join(ROOT, "scripts", "package-zarusa-api-upload.ps1")],
    { encoding: "utf8", cwd: ROOT }
  );
  if (r.status !== 0) {
    console.error(r.stdout || r.stderr);
    throw new Error("package-zarusa-api-upload.ps1 failed");
  }
}

function ftpUpload(localPath, remoteName, auth, ftpBase) {
  const r = curl(["-s", "-T", localPath, "--user", auth, `${ftpBase}/${remoteName}`]);
  if (r.code !== 0) {
    console.error(r.out);
    throw new Error(`FTP upload failed: ${remoteName}`);
  }
}

function makeMigrationRunner(token) {
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
$steps = [];

function col_exists(PDO $pdo, string $table, string $col): bool {
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS c FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t AND COLUMN_NAME = :c'
    );
    $stmt->execute([':t' => $table, ':c' => $col]);
    $row = $stmt->fetch();
    return $row && (int) $row['c'] > 0;
}

try {
    if (!col_exists($pdo, 'users', 'admin_country_code')) {
        $pdo->exec("ALTER TABLE users ADD COLUMN admin_country_code CHAR(2) DEFAULT NULL");
        $steps[] = 'added admin_country_code';
    } else {
        $steps[] = 'admin_country_code exists';
    }
    if (!col_exists($pdo, 'users', 'admin_region_code')) {
        $pdo->exec("ALTER TABLE users ADD COLUMN admin_region_code VARCHAR(64) DEFAULT NULL");
        $steps[] = 'added admin_region_code';
    } else {
        $steps[] = 'admin_region_code exists';
    }
    if (col_exists($pdo, 'users', 'role')) {
        $pdo->exec("ALTER TABLE users MODIFY COLUMN role VARCHAR(32) NOT NULL DEFAULT 'user'");
        $steps[] = 'role column widened to VARCHAR(32)';
    }

    $uid = '${BAMBAR_UID}';
    $email = 'bambar2006@gmail.com';
    $synced = 0;
    if ($uid !== '' && col_exists($pdo, 'users', 'firebase_uid')) {
        $stmt = $pdo->prepare(
            "UPDATE users SET role = 'region_admin', admin_country_code = 'US', admin_region_code = 'washington-dc'
             WHERE firebase_uid = :uid"
        );
        $stmt->execute([':uid' => $uid]);
        $synced = $stmt->rowCount();
        $steps[] = 'bambar by firebase_uid rows=' . $synced;
    }
    if ($synced === 0 && col_exists($pdo, 'users', 'email')) {
        $stmt = $pdo->prepare(
            "UPDATE users SET role = 'region_admin', admin_country_code = 'US', admin_region_code = 'washington-dc'
             WHERE email = :email"
        );
        $stmt->execute([':email' => $email]);
        $steps[] = 'bambar by email rows=' . $stmt->rowCount();
    }

    echo json_encode(['ok' => true, 'steps' => $steps], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
`;
}

async function main() {
  const { host, user, pass, remoteDir, skipMigration } = cfg();
  if (!user || !pass) {
    console.error("Missing FTP credentials. Set scripts/deploy-zarusa-api.local.env or ZARUSA_FTP_* env vars.");
    process.exit(1);
  }

  console.log("1. Package API bundle");
  packageBundle();

  const auth = `${user}:${pass}`;
  const ftpBase = `ftp://${host}/${remoteDir}`;

  console.log("2. Upload index.php + regions.php");
  ftpUpload(path.join(BUNDLE_DIR, "index.php"), "index.php", auth, ftpBase);
  ftpUpload(path.join(BUNDLE_DIR, "regions.php"), "regions.php", auth, ftpBase);

  if (!skipMigration) {
    console.log("3. Run admin RBAC migration");
    const token = crypto.randomUUID().replace(/-/g, "");
    const localRunner = path.join(BUNDLE_DIR, RUNNER_NAME);
    fs.writeFileSync(localRunner, makeMigrationRunner(token), "utf8");
    ftpUpload(localRunner, RUNNER_NAME, auth, ftpBase);

    const run = curl(["-s", "--max-time", "45", `https://api.zarkorea.com/${RUNNER_NAME}?token=${token}`]);
    console.log(run.out.trim() || "(no output)");
    curl(["-s", "--user", auth, "-Q", `CWD ${remoteDir}`, "-Q", `DELE ${RUNNER_NAME}`, `ftp://${host}/`]);
    fs.unlinkSync(localRunner);
  } else {
    console.log("3. Skipping migration (ZARUSA_SKIP_MIGRATION=1)");
  }

  console.log("4. Smoke test");
  const smoke = spawnSync("node", [path.join(ROOT, "scripts", "smoke-zarusa-dmv-api.mjs")], {
    encoding: "utf8",
    cwd: ROOT,
  });
  process.stdout.write(smoke.stdout || "");
  process.stderr.write(smoke.stderr || "");
  process.exit(smoke.status ?? 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
