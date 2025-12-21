import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { join } from 'path';
import { mkdir } from 'fs/promises';

const dbPath = join(process.cwd(), 'data', 'database.sqlite');

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = join(process.cwd(), 'data');
  try {
    await mkdir(dataDir, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }
}

// Initialize database
let sqliteDb: Database.Database | null = null;

function getSqliteDb() {
  if (!sqliteDb) {
    ensureDataDir();
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('journal_mode = WAL');
  }
  return sqliteDb;
}

export const db = drizzle(getSqliteDb(), { schema });

export { schema };
