import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "documents:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 403 });
    }

    const { id } = await params;
    const docId = Number(id);

    const [docs] = await query<any[]>(
      "SELECT * FROM documents WHERE id = ? LIMIT 1",
      [docId]
    );

    if (!docs) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    const doc = docs;
    const fullPath = path.join(process.cwd(), doc.file_path);

    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ success: false, error: "Physical file not found on disk" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": doc.mime_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.original_filename)}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Download failed" }, { status: 500 });
  }
}
