import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';

// In production, use `/tmp` directory; otherwise, use the local `db` folder
const dbDirectory = isProduction ? '/tmp' : path.resolve(process.cwd(), 'db');
const dbPath = path.join(dbDirectory, 'links.db');

// Ensure the directory exists (create it in production)
if (isProduction && !fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

// Copy the database file to `/tmp` in production, if it doesn't already exist
if (isProduction && !fs.existsSync(dbPath)) {
  const sourceDbPath = path.resolve(process.cwd(), 'db/links.db');
  if (fs.existsSync(sourceDbPath)) {
    fs.copyFileSync(sourceDbPath, dbPath);
  } else {
    console.error('Source database file not found:', sourceDbPath);
  }
}

// Initialize SQLite database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log(`Connected to SQLite database at ${dbPath}`);
  }
});

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS shared_links (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

export default db;
