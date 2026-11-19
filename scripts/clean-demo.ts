import mysql from "mysql2/promise";

async function cleanDemoData() {
  console.log("Cleaning demo transaction and test advocate data...");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bar-council",
  });

  try {
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0");

    console.log("Clearing sample transactions...");
    await connection.execute("TRUNCATE TABLE payment_allocations");
    await connection.execute("TRUNCATE TABLE payments");
    await connection.execute("TRUNCATE TABLE income_entries");
    await connection.execute("TRUNCATE TABLE expense_entries");
    await connection.execute("TRUNCATE TABLE fund_disbursements");
    await connection.execute("TRUNCATE TABLE claim_documents");
    await connection.execute("TRUNCATE TABLE death_benefit_claims");
    await connection.execute("TRUNCATE TABLE health_claims");
    await connection.execute("TRUNCATE TABLE documents");
    await connection.execute("TRUNCATE TABLE cases_register");
    await connection.execute("TRUNCATE TABLE waqalatnama_sale_items");
    await connection.execute("TRUNCATE TABLE waqalatnama_sales");
    await connection.execute("TRUNCATE TABLE waqalatnama_stock_movements");
    await connection.execute("TRUNCATE TABLE form_sales");
    await connection.execute("TRUNCATE TABLE form_stock_movements");
    await connection.execute("TRUNCATE TABLE donations");
    await connection.execute("TRUNCATE TABLE membership_dues");
    await connection.execute("TRUNCATE TABLE advocates");
    await connection.execute("TRUNCATE TABLE activity_logs");

    console.log("Resetting stock counts to 0 for fresh inventory entry...");
    await connection.execute("UPDATE waqalatnama_items SET current_stock = 0");
    await connection.execute("UPDATE form_types SET current_stock = 0");

    await connection.execute("SET FOREIGN_KEY_CHECKS = 1");

    console.log("\n========================================================");
    console.log(" ✅ DATABASE CLEANED SUCCESSFULLY FOR LIVE PRODUCTION!");
    console.log(" Master configuration, roles, permissions, categories,");
    console.log(" settings, and users remain intact.");
    console.log("========================================================\n");
  } catch (error) {
    console.error("Clean failed:", error);
  } finally {
    await connection.end();
  }
}

cleanDemoData();
