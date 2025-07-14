import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, 'migrations');

async function runMigrations() {
  const files = (await readdir(migrationsDir))
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = await readFile(filePath, 'utf8');
    try {
      console.log(`Running migration: ${file}`);
      await pool.query(sql);
      console.log(`Success: ${file}`);
    } catch (err) {
      console.error(`Error running migration ${file}:`, err);
      process.exit(1);
    }
  }
  await pool.end();
  console.log('All migrations applied.');
}

console.log('Using database:', process.env.DATABASE_URL);

runMigrations(); 