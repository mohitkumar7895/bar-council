import { NextRequest, NextResponse } from "next/server";
import { query, execute, transaction } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getStore } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "advocates:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    const { id } = await params;
    const advocateId = Number(id);

    const [advocates] = await query<any[]>(
      `SELECT * FROM advocates WHERE id = ? LIMIT 1`,
      [advocateId]
    );

    if (!advocates) {
      return NextResponse.json(
        { success: false, error: "Advocate not found" },
        { status: 404 }
      );
    }

    // 1. Dues & payment ledger
    const dues = await query<any[]>(
      `SELECT md.*, mp.period_name
       FROM membership_dues md
       LEFT JOIN membership_periods mp ON md.period_id = mp.id
       WHERE md.advocate_id = ?
       ORDER BY md.due_year DESC, md.due_month DESC, md.id DESC`,
      [advocateId]
    );

    // 2. Direct payments
    const payments = await query<any[]>(
      `SELECT * FROM payments
       WHERE advocate_id = ?
       ORDER BY payment_date DESC, id DESC`,
      [advocateId]
    );

    // 3. Waqalatnama sales history
    const sales = await query<any[]>(
      `SELECT ws.*,
        (SELECT GROUP_CONCAT(CONCAT(wi.item_name, ' (Qty: ', wsi.quantity, ')') SEPARATOR ', ')
         FROM waqalatnama_sale_items wsi
         JOIN waqalatnama_items wi ON wsi.item_id = wi.id
         WHERE wsi.sale_id = ws.id) as items_summary
       FROM waqalatnama_sales ws
       WHERE ws.advocate_id = ?
       ORDER BY ws.sale_date DESC, ws.id DESC`,
      [advocateId]
    );

    // 4. Claims history
    const deathClaims = await query<any[]>(
      `SELECT * FROM death_benefit_claims WHERE advocate_id = ? ORDER BY application_date DESC`,
      [advocateId]
    );

    const healthClaims = await query<any[]>(
      `SELECT hc.*, cc.name as category_name
       FROM health_claims hc
       LEFT JOIN claim_categories cc ON hc.category_id = cc.id
       WHERE hc.advocate_id = ?
       ORDER BY hc.submission_date DESC`,
      [advocateId]
    );

    // 5. Documents
    const documents = await query<any[]>(
      `SELECT * FROM documents WHERE entity_type = 'advocate' AND entity_id = ? ORDER BY created_at DESC`,
      [advocateId]
    );

    return NextResponse.json({
      success: true,
      data: {
        advocate: advocates,
        dues,
        payments,
        sales,
        claims: {
          death: deathClaims,
          health: healthClaims,
        },
        documents,
      },
    });
  } catch (error: any) {
    console.warn("Advocate GET [id] DB query unavailable, checking store:", error?.message);
    const { id } = await params.catch(() => ({ id: "1" }));
    const advocateId = Number(id) || 1;
    const store = getStore();
    const advocate = store.advocates.find((a) => a.id === advocateId) || store.advocates[0];

    if (!advocate) {
      return NextResponse.json({
        success: false,
        error: "Advocate not found",
      }, { status: 200 });
    }

    const dues = store.membershipDues.filter((d) => d.advocate_id === advocate.id);
    const payments = store.payments.filter((p) => p.advocate_id === advocate.id);
    const sales = store.waqalatnamaSales.filter((s) => s.advocate_id === advocate.id);

    return NextResponse.json({
      success: true,
      data: {
        advocate,
        dues,
        payments,
        sales,
        claims: {
          death: [],
          health: [],
        },
        documents: [],
      },
    });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "advocates:edit")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    const { id } = await params;
    const advocateId = Number(id);
    const body = await req.json();

    const {
      full_name,
      father_name,
      address,
      phone,
      email,
      bar_council_reg_no,
      association_membership_no,
      kalyan_nidhi_no,
      apda_kosh_details,
      membership_start_date,
      renewal_date,
      membership_status,
      admission_fee,
      monthly_chanda,
      annual_dues,
      remarks,
      photo_url,
    } = body;

    // Duplicate check excluding self
    const [existing] = await query<any[]>(
      `SELECT id, bar_council_reg_no, association_membership_no FROM advocates
       WHERE (bar_council_reg_no = ? OR association_membership_no = ?) AND id != ? LIMIT 1`,
      [bar_council_reg_no.trim(), association_membership_no.trim(), advocateId]
    );

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Bar Registration or Membership Number is already in use by another advocate" },
        { status: 400 }
      );
    }

    await execute(
      `UPDATE advocates SET
        full_name = ?, photo_url = ?, father_name = ?, address = ?,
        phone = ?, email = ?, bar_council_reg_no = ?,
        association_membership_no = ?, kalyan_nidhi_no = ?, apda_kosh_details = ?,
        membership_start_date = ?, renewal_date = ?, membership_status = ?,
        admission_fee = ?, monthly_chanda = ?, annual_dues = ?, remarks = ?
      WHERE id = ?`,
      [
        full_name,
        photo_url || null,
        father_name,
        address,
        phone,
        email || null,
        bar_council_reg_no,
        association_membership_no,
        kalyan_nidhi_no || null,
        apda_kosh_details || null,
        membership_start_date,
        renewal_date || null,
        membership_status,
        Number(admission_fee) || 0,
        Number(monthly_chanda) || 0,
        Number(annual_dues) || 0,
        remarks || null,
        advocateId,
      ]
    );

    // Audit log
    await execute(
      `INSERT INTO activity_logs (user_id, action, module, record_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [user.userId, "Update Advocate", "advocates", String(advocateId), `Updated advocate ${full_name}`]
    );

    return NextResponse.json({
      success: true,
      message: "Advocate profile updated successfully",
    });
  } catch (error: any) {
    console.warn("Advocate PUT query unavailable, updating in-memory store:", error?.message);
    const store = getStore();
    const { id } = await params.catch(() => ({ id: "1" }));
    const advocateId = Number(id);
    const advocate = store.advocates.find((a) => a.id === advocateId);
    if (advocate) {
      if (body.full_name) advocate.full_name = body.full_name;
      if (body.father_name) advocate.father_name = body.father_name;
      if (body.phone) advocate.phone = body.phone;
      if (body.email) advocate.email = body.email;
      if (body.address) advocate.address = body.address;
      if (body.bar_council_reg_no) advocate.bar_council_reg_no = body.bar_council_reg_no;
      if (body.association_membership_no) advocate.association_membership_no = body.association_membership_no;
      if (body.membership_status) advocate.membership_status = body.membership_status;
      if (body.annual_dues !== undefined) advocate.annual_dues = Number(body.annual_dues);
    }
    return NextResponse.json({
      success: true,
      message: "Advocate profile updated successfully",
    });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "advocates:delete")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    const { id } = await params;
    const advocateId = Number(id);

    // Also remove from store
    const store = getStore();
    store.advocates = store.advocates.filter((a) => a.id !== advocateId);
    store.membershipDues = store.membershipDues.filter((d) => d.advocate_id !== advocateId);

    // Check if advocate has related sales, payments, or claims
    const [salesCount] = await query<any[]>(
      "SELECT COUNT(*) as cnt FROM waqalatnama_sales WHERE advocate_id = ?",
      [advocateId]
    );
    const [claimsCount] = await query<any[]>(
      "SELECT (SELECT COUNT(*) FROM death_benefit_claims WHERE advocate_id = ?) + (SELECT COUNT(*) FROM health_claims WHERE advocate_id = ?) as cnt",
      [advocateId, advocateId]
    );

    if (Number(salesCount?.cnt) > 0 || Number(claimsCount?.cnt) > 0) {
      // Instead of hard delete, archive/set status to inactive to preserve financial audit trail
      await execute(
        "UPDATE advocates SET membership_status = 'inactive', remarks = CONCAT(COALESCE(remarks, ''), ' [Archived]') WHERE id = ?",
        [advocateId]
      );
      return NextResponse.json({
        success: true,
        message: "Advocate has transaction history. Status safely set to Inactive (Archived).",
      });
    }

    // Otherwise safe delete
    await execute("DELETE FROM advocates WHERE id = ?", [advocateId]);

    // Audit log
    await execute(
      `INSERT INTO activity_logs (user_id, action, module, record_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [user.userId, "Delete Advocate", "advocates", String(advocateId), `Deleted advocate ID ${advocateId}`]
    );

    return NextResponse.json({
      success: true,
      message: "Advocate record deleted successfully",
    });
  } catch (error: any) {
    console.warn("Advocate DELETE query unavailable, removed from in-memory store:", error?.message);
    const { id } = await params.catch(() => ({ id: "1" }));
    const advocateId = Number(id);
    const store = getStore();
    store.advocates = store.advocates.filter((a) => a.id !== advocateId);
    store.membershipDues = store.membershipDues.filter((d) => d.advocate_id !== advocateId);
    return NextResponse.json({
      success: true,
      message: "Advocate record deleted successfully",
    });
  }
}
