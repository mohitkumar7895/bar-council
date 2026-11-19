import { NextResponse } from "next/server";
import { testConnection, query } from "@/lib/db";

export async function GET() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const user = process.env.DB_USER || "root";
  const database = process.env.DB_NAME || "bar-council";
  const isVercel = !!process.env.VERCEL;

  try {
    const isConnected = await testConnection();
    if (isConnected) {
      const [userCount] = await query<any[]>("SELECT COUNT(*) as count FROM users");
      return NextResponse.json({
        status: "healthy",
        database: "connected",
        host,
        database_name: database,
        isVercel,
        users_in_db: userCount?.count ?? 0,
        message: "MySQL database connected successfully",
      });
    } else {
      throw new Error("testConnection returned false");
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "failed",
        host,
        database_name: database,
        isVercel,
        error_code: err?.code,
        error_message: err?.message,
        tip:
          isVercel && (host === "127.0.0.1" || host === "localhost")
            ? "Your project is deployed on Vercel, but DB_HOST is set to localhost/127.0.0.1. Vercel serverless containers cannot access your local PC's MySQL. Please set up a free Cloud MySQL database (e.g. TiDB Cloud, Aiven, Railway, Supabase) and enter DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in Vercel Project Settings > Environment Variables."
            : "Please verify MySQL is running and your credentials are correct.",
      },
      { status: 500 }
    );
  }
}
