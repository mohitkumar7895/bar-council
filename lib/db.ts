import mysql, { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from "mysql2/promise";

let pool: Pool;

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global.__dbPool) {
    const host = process.env.DB_HOST || "127.0.0.1";
    const isRemote = host !== "127.0.0.1" && host !== "localhost";
    const useSSL = process.env.DB_SSL === "true" || (isRemote && process.env.DB_SSL !== "false");

    global.__dbPool = mysql.createPool({
      host,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "bar-council",
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      dateStrings: true,
      decimalNumbers: true,
      ssl: useSSL ? { rejectUnauthorized: false } : undefined,
    });
  }
  return global.__dbPool;
}

pool = getPool();

/**
 * Execute a parameterized query with safe prepared statements
 */
export async function query<T = RowDataPacket[]>(
  sql: string,
  params: any[] = []
): Promise<T> {
  const p = getPool();
  const [results] = await p.execute(sql, params);
  return results as unknown as T;
}

/**
 * Execute an INSERT / UPDATE / DELETE query and return ResultSetHeader
 */
export async function execute(
  sql: string,
  params: any[] = []
): Promise<ResultSetHeader> {
  const p = getPool();
  const [results] = await p.execute(sql, params);
  return results as ResultSetHeader;
}

/**
 * Execute operations within an atomic MySQL transaction
 */
export async function transaction<T>(
  callback: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Test connectivity
 */
export async function testConnection(): Promise<boolean> {
  try {
    const p = getPool();
    const [res] = await p.query("SELECT 1 AS alive");
    return Array.isArray(res) && res.length > 0;
  } catch (err) {
    console.error("Database connection failed:", err);
    return false;
  }
}

export default pool;
