require("dotenv").config();

const fs = require("node:fs");
const mysql = require("mysql2/promise");

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DB_NAME, tableName, columnName]
  );
  return rows.length > 0;
}

async function run() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  });

  const columns = [
    ["auth_provider", "ALTER TABLE users ADD COLUMN auth_provider ENUM('local', 'google', 'facebook', 'apple') NOT NULL DEFAULT 'local' AFTER cookies_consent"],
    ["provider_id", "ALTER TABLE users ADD COLUMN provider_id VARCHAR(255) DEFAULT NULL AFTER auth_provider"],
    ["email_verified", "ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER provider_id"],
    ["two_factor_enabled", "ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER email_verified"],
    ["two_factor_secret", "ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255) DEFAULT NULL AFTER two_factor_enabled"],
    ["two_factor_pending_secret", "ALTER TABLE users ADD COLUMN two_factor_pending_secret VARCHAR(255) DEFAULT NULL AFTER two_factor_secret"],
    ["two_factor_recovery_codes", "ALTER TABLE users ADD COLUMN two_factor_recovery_codes JSON DEFAULT NULL AFTER two_factor_pending_secret"],
    ["last_login_at", "ALTER TABLE users ADD COLUMN last_login_at DATETIME DEFAULT NULL AFTER two_factor_recovery_codes"],
  ];

  for (const [columnName, statement] of columns) {
    if (!(await columnExists(connection, "users", columnName))) {
      await connection.query(statement);
    }
  }

  const sql = fs
    .readFileSync("./database/patch_auth_security.sql", "utf8")
    .replace(/ALTER TABLE users[\s\S]*?;\s*/m, "");
  await connection.query(sql);
  await connection.end();

  console.info("Auth security patch applied");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
