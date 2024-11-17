import sqlite3 from 'sqlite3';
import path from 'path';

const config = useRuntimeConfig();

// Create database connection
const db = new sqlite3.Database(
  path.resolve(process.cwd(), config.public.dbPath)
);

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
