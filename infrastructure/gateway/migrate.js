/**
 * Schema Migration Runner
 *
 * Applies pending SQL migrations from the migrations/ directory on gateway
 * startup. Tracks applied migrations in a schema_migrations table so
 * existing Docker volumes get schema updates — solving the
 * docker-entrypoint-initdb.d "only runs on first boot" problem.
 *
 * Runs inside a transaction per migration. If any migration fails, the
 * gateway refuses to report healthy, blocking downstream containers.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT now()
);
`;

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export async function runMigrations(pool) {
  await pool.query(BOOTSTRAP_SQL);

  const applied = await pool.query(
    "SELECT filename, checksum FROM schema_migrations ORDER BY id"
  );
  const appliedMap = new Map(applied.rows.map((r) => [r.filename, r.checksum]));

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log("[migrate] No migrations directory — skipping");
    return { applied: 0, skipped: 0 };
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let appliedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    const checksum = sha256(sql);

    if (appliedMap.has(file)) {
      const existingChecksum = appliedMap.get(file);
      if (existingChecksum !== checksum) {
        console.error(
          `[migrate] CHECKSUM MISMATCH for ${file}: expected ${existingChecksum}, got ${checksum}. ` +
            `Migration file was modified after being applied. This is dangerous — aborting.`
        );
        throw new Error(`Checksum mismatch on already-applied migration: ${file}`);
      }
      skippedCount++;
      continue;
    }

    console.log(`[migrate] Applying ${file}...`);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)",
        [file, checksum]
      );
      await client.query("COMMIT");
      appliedCount++;
      console.log(`[migrate] ✓ ${file}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`[migrate] ✗ ${file}: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }

  if (appliedCount === 0) {
    console.log(`[migrate] Schema is up to date (${skippedCount} migrations already applied)`);
  } else {
    console.log(`[migrate] Applied ${appliedCount} new migration(s), ${skippedCount} already applied`);
  }

  return { applied: appliedCount, skipped: skippedCount };
}
