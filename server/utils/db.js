import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const config = useRuntimeConfig();
const dbDirectory = path.resolve(process.cwd(), 'db');
const dbFilePath = path.join(dbDirectory, 'links.db');

// Ensure the database directory exists
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
  console.log(`Created directory: ${dbDirectory}`);
}

// Create database connection
const db = new sqlite3.Database(dbFilePath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log(`Connected to SQLite database at ${dbFilePath}`);
  }
});

// Initialize the database table
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
