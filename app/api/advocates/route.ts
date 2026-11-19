import { NextRequest, NextResponse } from "next/server";
import { query, execute, transaction } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit")) || 10));
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const offset = (page - 1) * limit;

  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "advocates:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized", unauthenticated: !user }, { status: 200 });
    }

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (status && status !== "all") {
      whereClause += " AND a.membership_status = ?";
      params.push(status);
    }

    if (search) {
      whereClause += ` AND (
        a.full_name LIKE ? OR
        a.phone LIKE ? OR
        a.email LIKE ? OR
        a.bar_council_reg_no LIKE ? OR
        a.association_membership_no LIKE ? OR
        a.advocate_code LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern
      );
    }

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM advocates a ${whereClause}`;
    const [countRes] = await query<any[]>(countSql, params);
    const total = Number(countRes?.total) || 0;

    // Fetch records with outstanding balance subquery
    const sql = `
      SELECT
        a.*,
        COALESCE((SELECT SUM(md.paid_amount) FROM membership_dues md WHERE md.advocate_id = a.id), 0) as total_paid,
        COALESCE((SELECT SUM(md.amount - md.paid_amount) FROM membership_dues md WHERE md.advocate_id = a.id AND md.status != 'paid'), 0) as outstanding_amount
      FROM advocates a
      ${whereClause}
      ORDER BY a.id DESC
      LIMIT ? OFFSET ?
    `;

    const records = await query<any[]>(sql, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.warn("Advocates GET query unavailable, using store:", error?.message);
    const store = getStore();
    let records = [...store.advocates];

    if (status && status !== "all") {
      records = records.filter((a) => a.membership_status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (a) =>
          a.full_name?.toLowerCase().includes(q) ||
          a.phone?.includes(q) ||
          a.bar_council_reg_no?.toLowerCase().includes(q) ||
          a.association_membership_no?.toLowerCase().includes(q) ||
          a.advocate_code?.toLowerCase().includes(q)
      );
    }

    const total = records.length;
    const paginated = records.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  }
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "advocates:create")) {
      return NextResponse.json({ success: false, error: "Unauthorized", unauthenticated: !user }, { status: 200 });
    }

    body = await req.json();
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
      membership_status = "active",
      admission_fee = 5000.0,
      monthly_chanda = 100.0,
      annual_dues = 1200.0,
      remarks,
      photo_url,
    } = body;

    if (!full_name || !father_name || !phone || !bar_council_reg_no || !association_membership_no) {
      return NextResponse.json(
        { success: false, error: "Required fields missing (Name, Father's Name, Phone, Bar Reg No, Membership No)" },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { success: false, error: "Phone / Mobile Number must be exactly 10 digits" },
        { status: 400 }
      );
    }

    // Check duplicates
    const [existing] = await query<any[]>(
      `SELECT id, bar_council_reg_no, association_membership_no FROM advocates
       WHERE bar_council_reg_no = ? OR association_membership_no = ? LIMIT 1`,
      [bar_council_reg_no.trim(), association_membership_no.trim()]
    );

    if (existing) {
      if (existing.bar_council_reg_no.toLowerCase() === bar_council_reg_no.trim().toLowerCase()) {
        return NextResponse.json(
          { success: false, error: `Bar Council Registration No "${bar_council_reg_no}" is already registered.` },
          { status: 400 }
        );
      }
      if (existing.association_membership_no.toLowerCase() === association_membership_no.trim().toLowerCase()) {
        return NextResponse.json(
          { success: false, error: `Association Membership No "${association_membership_no}" is already registered.` },
          { status: 400 }
        );
      }
    }

    // Auto-generate code e.g. ADV-2026-XXXX
    const year = new Date().getFullYear();
    const [lastRecord] = await query<any[]>(
      "SELECT id FROM advocates ORDER BY id DESC LIMIT 1"
    );
    const nextId = (lastRecord?.id || 0) + 1;
    const advocate_code = `ADV-${year}-${String(nextId).padStart(4, "0")}`;

    const startDate = membership_start_date || new Date().toISOString().split("T")[0];

    const result = await transaction(async (conn) => {
      const [insertRes] = await conn.execute<any>(
        `INSERT INTO advocates (
          advocate_code, full_name, photo_url, father_name, address, phone, email,
          bar_council_reg_no, association_membership_no, kalyan_nidhi_no, apda_kosh_details,
          membership_start_date, renewal_date, membership_status, admission_fee,
          monthly_chanda, annual_dues, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          advocate_code,
          full_name.trim(),
          photo_url || null,
          father_name.trim(),
          address || null,
          phone.trim(),
          email?.trim() || null,
          bar_council_reg_no.trim(),
          association_membership_no.trim(),
          kalyan_nidhi_no?.trim() || null,
          apda_kosh_details?.trim() || null,
          startDate,
          renewal_date || null,
          membership_status,
          Number(admission_fee) || 0,
          Number(monthly_chanda) || 0,
          Number(annual_dues) || 0,
          remarks || null,
        ]
      );

      const advocateId = insertRes.insertId;

      // Automatically create membership dues for the current active period if available
      const [periods] = await conn.execute<any>(
        "SELECT id FROM membership_periods WHERE is_current = 1 LIMIT 1"
      );
      if (periods && periods.length > 0) {
        const periodId = periods[0].id;
        // Annual due
        await conn.execute(
          `INSERT INTO membership_dues (advocate_id, period_id, due_type, due_year, amount, paid_amount, status, due_date)
           VALUES (?, ?, 'annual_dues', ?, ?, 0.00, 'unpaid', ?)`,
          [advocateId, periodId, year, Number(annual_dues) || 1200.0, `${year}-04-30`]
        );
      }

      // Log activity
      await conn.execute(
        `INSERT INTO activity_logs (user_id, action, module, record_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [
          user.userId,
          "Create Advocate",
          "advocates",
          advocate_code,
          `Registered advocate ${full_name} (${advocate_code})`,
        ]
      );

      const store = getStore();
      store.advocates.unshift({
        id: advocateId,
        advocate_code,
        full_name: full_name.trim(),
        photo_url: photo_url || null,
        father_name: father_name.trim(),
        address: address || null,
        phone: phone.trim(),
        email: email?.trim() || null,
        bar_council_reg_no: bar_council_reg_no.trim(),
        association_membership_no: association_membership_no.trim(),
        kalyan_nidhi_no: kalyan_nidhi_no?.trim() || null,
        apda_kosh_details: apda_kosh_details?.trim() || null,
        membership_start_date: startDate,
        renewal_date: renewal_date || null,
        membership_status,
        admission_fee: Number(admission_fee) || 0,
        monthly_chanda: Number(monthly_chanda) || 0,
        annual_dues: Number(annual_dues) || 0,
        total_paid: 0,
        outstanding_amount: Number(annual_dues) || 1200,
        remarks: remarks || null,
        created_at: new Date().toISOString(),
      });

      return { advocateId, advocate_code };
    });

    return NextResponse.json({
      success: true,
      message: "Advocate successfully registered",
      data: result,
    });
  } catch (error: any) {
    console.warn("Advocates POST query unavailable, storing in memory:", error?.message);
    const store = getStore();
    const newId = store.advocates.length > 0 ? Math.max(...store.advocates.map((a) => a.id)) + 1 : 1;
    const year = new Date().getFullYear();
    const advocate_code = `ADV-${year}-${String(newId).padStart(4, "0")}`;

    const newAdvocate = {
      id: newId,
      advocate_code,
      full_name: body?.full_name?.trim() || "Advocate",
      photo_url: body?.photo_url || null,
      father_name: body?.father_name?.trim() || "",
      address: body?.address?.trim() || "",
      phone: body?.phone?.trim() || "",
      email: body?.email?.trim() || "",
      bar_council_reg_no: body?.bar_council_reg_no?.trim() || `BC/${year}/${newId}`,
      association_membership_no: body?.association_membership_no?.trim() || `DBA-${newId}`,
      kalyan_nidhi_no: body?.kalyan_nidhi_no?.trim() || "",
      apda_kosh_details: body?.apda_kosh_details?.trim() || "",
      membership_start_date: body?.membership_start_date || new Date().toISOString().split("T")[0],
      renewal_date: body?.renewal_date || null,
      membership_status: body?.membership_status || "active",
      admission_fee: Number(body?.admission_fee) || 5000,
      monthly_chanda: Number(body?.monthly_chanda) || 100,
      annual_dues: Number(body?.annual_dues) || 1200,
      total_paid: 0,
      outstanding_amount: Number(body?.annual_dues) || 1200,
      remarks: body?.remarks || "",
      created_at: new Date().toISOString(),
    };

    store.advocates.unshift(newAdvocate);

    // Also auto-add annual dues for this new advocate in store
    store.membershipDues.unshift({
      id: store.membershipDues.length + 1,
      advocate_id: newId,
      advocate_name: newAdvocate.full_name,
      advocate_code,
      phone: newAdvocate.phone,
      bar_council_reg_no: newAdvocate.bar_council_reg_no,
      due_type: "annual_dues",
      due_year: year,
      due_month: null,
      period_name: `Calendar Year ${year}`,
      amount: newAdvocate.annual_dues,
      paid_amount: 0,
      status: "unpaid",
      due_date: `${year}-04-30`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Advocate successfully registered",
      data: { advocateId: newId, advocate_code },
    });
  }
}
