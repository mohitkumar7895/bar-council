import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";

async function initDb() {
  console.log("Initializing database schema from scripts/database.sql...");

  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "bar-council";

  // Connect to MySQL server
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
  });

  try {
    const sqlPath = path.join(process.cwd(), "scripts", "database.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");

    console.log(`Executing SQL script for database: ${database}...`);
    await connection.query(sqlContent);
    console.log("Schema created successfully.");
  } catch (err) {
    console.error("Failed to initialize database schema:", err);
    throw err;
  } finally {
    await connection.end();
  }
}

initDb();
