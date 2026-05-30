#!/usr/bin/env node
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const sqlDir = path.join(__dirname, 'database');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = typeof process.env.DB_PASSWORD !== 'undefined' ? process.env.DB_PASSWORD : '';
const DB_NAME = process.env.DB_NAME || 'blog_a_part';

async function main() {
  try {
    // Look for a top-level `database.sql` in the backend folder, and also
    // include SQL files found under backend/database/.
    const topDbFile = path.join(__dirname, 'database.sql');
    const orderedFiles = [];

    if (fs.existsSync(topDbFile)) {
      orderedFiles.push(topDbFile);
    }

    if (fs.existsSync(sqlDir)) {
      const dirFiles = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();
      for (const f of dirFiles) {
        if (f === 'database.sql') continue; // already handled if present at top
        orderedFiles.push(path.join(sqlDir, f));
      }
    }

    const conn = await mysql.createConnection({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true
    });

    console.log(`[migrate] Connected to ${DB_HOST}:${DB_PORT} as ${DB_USER}`);

    // Temporarily disable foreign key checks to allow patches to apply in any order
    await conn.query('SET FOREIGN_KEY_CHECKS=0;');

    for (const fullPath of orderedFiles) {
      const file = path.basename(fullPath);
      console.log('[migrate] Executing', file);
      let sql = fs.readFileSync(fullPath, 'utf8');
      if (!sql || !sql.trim()) {
        console.log('[migrate] Skipping empty file', file);
        continue;
      }

      // Split into statements by semicolon. This is a simple splitter and
      // assumes SQL files don't contain complex delimiter changes.
      const rawStatements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);

      try {
        for (const stmt of rawStatements) {
          if (!stmt) continue;

          const stmtUpper = stmt.toUpperCase();

          // Handle ALTER TABLE ... ADD COLUMN IF NOT EXISTS ... (compatibility)
          if (stmtUpper.startsWith('ALTER TABLE') && /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/i.test(stmt)) {
            const tableMatch = stmt.match(/ALTER\s+TABLE\s+`?([A-Za-z0-9_]+)`?/i);
            const tableName = tableMatch ? tableMatch[1] : null;
            if (!tableName) {
              console.log('[migrate] Cannot determine table name for ALTER statement, executing raw');
              await conn.query(stmt);
              continue;
            }

            // Find each ADD COLUMN IF NOT EXISTS clause
            const addRegex = /ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+([^,]+)/ig;
            let m;
            const clauses = [];
            while ((m = addRegex.exec(stmt)) !== null) {
              clauses.push(m[1].trim());
            }

            if (clauses.length === 0) {
              // fallback: execute the whole statement
              await conn.query(stmt);
              continue;
            }

            for (const clause of clauses) {
              // Extract column name (first token)
              const colMatch = clause.match(/`?([A-Za-z0-9_]+)`?\s+/);
              if (!colMatch) {
                console.log('[migrate] Cannot parse column name from clause, executing raw clause');
                try {
                  await conn.query(`ALTER TABLE ${tableName} ADD COLUMN ${clause}`);
                } catch (e) {
                  console.error('[migrate] Failed to execute clause:', clause, e.message);
                  throw e;
                }
                continue;
              }

              const columnName = colMatch[1];
              const [rows] = await conn.query(
                'SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
                [DB_NAME, tableName, columnName]
              );
              const exists = rows && rows[0] && rows[0].cnt > 0;
              if (exists) {
                console.log(`[migrate] Column ${tableName}.${columnName} already exists — skipping`);
                continue;
              }

              // Execute only the ADD COLUMN clause
              const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${clause}`;
              console.log('[migrate] Adding column with', alterSql);
              await conn.query(alterSql);
            }

            continue;
          }

          // For other statements, execute directly
          await conn.query(stmt);
        }

        // If we just executed the main database creation file, ensure the
        // connection is using the target database for subsequent statements.
        if (file === 'database.sql') {
          try {
            await conn.changeUser({ database: DB_NAME });
            console.log('[migrate] Selected database', DB_NAME);
          } catch (e) {
            console.warn('[migrate] Warning: could not change database to', DB_NAME, e.message || e);
          }
        }

        console.log('[migrate] OK', file);
      } catch (err) {
        console.error('[migrate] Error executing', file, err.message || err);
        console.error('[migrate] SQL preview:', sql.slice(0, 2000));
        throw err;
      }
    }

    await conn.query('SET FOREIGN_KEY_CHECKS=1;');
    await conn.end();
    console.log('[migrate] All migrations applied successfully.');
  } catch (err) {
    console.error('[migrate] Migration failed:', err.message || err);
    process.exitCode = 1;
  }
}

main();
