require("dotenv").config();

const fs = require("node:fs");
const mysql = require("mysql2/promise");

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

async function run() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  });

  const sql = fs.readFileSync("./database/patch_builder.sql", "utf8");
  await connection.query(sql);
  await connection.end();

  console.info("Builder patch applied");
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
