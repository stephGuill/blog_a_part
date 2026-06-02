require("dotenv").config();

const mysql = require("mysql2/promise");
const fs = require("node:fs");

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

async function columnExists(connection, tableName, columnName) {
  const [rows] = await connection.query(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    `,
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

  if (!(await columnExists(connection, "users", "platform_role"))) {
    await connection.query(
      "ALTER TABLE users ADD COLUMN platform_role ENUM('admin', 'user') NOT NULL DEFAULT 'user' AFTER role"
    );
  }

  if (!(await columnExists(connection, "users", "avatar_url"))) {
    await connection.query(
      "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL AFTER full_name"
    );
  }

  if (!(await columnExists(connection, "users", "status"))) {
    await connection.query(
      "ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'suspended', 'banned', 'pending') NOT NULL DEFAULT 'active' AFTER platform_role"
    );
  }

  const legalConsentColumns = [
    ["accepted_terms", "ALTER TABLE users ADD COLUMN accepted_terms BOOLEAN NOT NULL DEFAULT FALSE AFTER is_active"],
    ["accepted_terms_at", "ALTER TABLE users ADD COLUMN accepted_terms_at DATETIME DEFAULT NULL AFTER accepted_terms"],
    ["accepted_terms_version", "ALTER TABLE users ADD COLUMN accepted_terms_version VARCHAR(50) DEFAULT NULL AFTER accepted_terms_at"],
    ["accepted_privacy", "ALTER TABLE users ADD COLUMN accepted_privacy BOOLEAN NOT NULL DEFAULT FALSE AFTER accepted_terms_version"],
    ["accepted_privacy_at", "ALTER TABLE users ADD COLUMN accepted_privacy_at DATETIME DEFAULT NULL AFTER accepted_privacy"],
    ["accepted_privacy_version", "ALTER TABLE users ADD COLUMN accepted_privacy_version VARCHAR(50) DEFAULT NULL AFTER accepted_privacy_at"],
    ["marketing_consent", "ALTER TABLE users ADD COLUMN marketing_consent BOOLEAN NOT NULL DEFAULT FALSE AFTER accepted_privacy_version"],
    ["cookies_consent", "ALTER TABLE users ADD COLUMN cookies_consent JSON DEFAULT NULL AFTER marketing_consent"],
  ];

  for (const [columnName, statement] of legalConsentColumns) {
    if (!(await columnExists(connection, "users", columnName))) {
      await connection.query(statement);
    }
  }

  await connection.query("UPDATE users SET platform_role = 'admin' WHERE role = 'admin'");
  await connection.query("UPDATE users SET platform_role = 'user' WHERE role <> 'admin'");
  await connection.query("UPDATE users SET status = IF(is_active = TRUE, 'active', 'inactive') WHERE status IS NULL");

  const sql = fs
    .readFileSync("./database/patch_saas_permissions.sql", "utf8")
    .replace(/ALTER TABLE users[\s\S]*?UPDATE users SET platform_role = 'user' WHERE role <> 'admin';/m, "");

  await connection.query(sql);

  const auditColumns = [
    ["old_values", "ALTER TABLE audit_logs ADD COLUMN old_values JSON AFTER action"],
    ["new_values", "ALTER TABLE audit_logs ADD COLUMN new_values JSON AFTER old_values"],
    ["ip_address", "ALTER TABLE audit_logs ADD COLUMN ip_address VARCHAR(45) AFTER metadata_json"],
    ["user_agent", "ALTER TABLE audit_logs ADD COLUMN user_agent TEXT AFTER ip_address"],
    ["bulk_action_id", "ALTER TABLE audit_logs ADD COLUMN bulk_action_id VARCHAR(100) AFTER user_agent"],
  ];

  for (const [columnName, statement] of auditColumns) {
    if (!(await columnExists(connection, "audit_logs", columnName))) {
      await connection.query(statement);
    }
  }

  await connection.end();

  console.info("SaaS permissions patch applied");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
