import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool, types } = pg;

/**
 * TIMESTAMP WITHOUT TIME ZONE is wall-clock (e.g. delivery 11:00).
 * Default node-pg → JS Date → JSON "…Z" shifts by device/server TZ.
 * Keep as string so every client shows the same time.
 * OID 1114 = timestamp (no tz)
 */
types.setTypeParser(1114, (value) => {
  if (value == null) return value;
  // "2026-07-17 11:00:00" or "2026-07-17 11:00:00.123456"
  return String(value)
    .trim()
    .replace(" ", "T")
    .replace(/\.\d+$/, "");
});

/**
 * DATE WITHOUT TIME ZONE — keep as YYYY-MM-DD string.
 * Default node-pg → JS Date → JSON "…Z" shifts the calendar day by timezone.
 * OID 1082 = date
 */
types.setTypeParser(1082, (value) => {
  if (value == null) return value;
  return String(value).trim().slice(0, 10);
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;