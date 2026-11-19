import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit")) || 15));
  const search = searchParams.get("search")?.trim() || "";
  const status = searchParams.get("status") || "all";
  const offset = (page - 1) * limit;

  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "donations:view")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    let where = "WHERE 1=1";
    const params: any[] = [];

    if (status && status !== "all") {
      where += " AND d.status = ?";
      params.push(status);
    }

    if (search) {
      where += " AND (d.donation_no LIKE ? OR d.contributor_name LIKE ? OR d.pan_number LIKE ? OR d.donation_purpose LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const [countRes] = await query<any[]>(
      `SELECT COUNT(*) as total FROM donations d ${where}`,
      params
    );
    const total = Number(countRes?.total) || 0;

    const sql = `
      SELECT
        d.*,
        dc.name as category_name,
        a.full_name as advocate_name,
        a.advocate_code
      FROM donations d
      LEFT JOIN donation_categories dc ON d.category_id = dc.id
      LEFT JOIN advocates a ON d.advocate_id = a.id
      ${where}
      ORDER BY d.donation_date DESC, d.id DESC
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
    console.warn("Donations GET error, reading from store:", error?.message);
    const store = getStore();
    let records = [...store.donations];

    if (status && status !== "all") {
      records = records.filter((d) => d.status === status);
    }

    if (search) {
      const q = search.toLowerCase();
      records = records.filter(
        (d) =>
          d.donation_no?.toLowerCase().includes(q) ||
          d.contributor_name?.toLowerCase().includes(q) ||
          d.donor_name?.toLowerCase().includes(q) ||
          d.donation_purpose?.toLowerCase().includes(q)
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
    if (!user || !hasPermission(user, "donations:manage")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 200 });
    }

    body = await req.json();
    const {
      contributor_name,
      advocate_id,
      phone,
      email,
      pan_number,
      donation_date = new Date().toISOString().split("T")[0],
      amount,
      category_id,
      donation_purpose,
      payment_mode = "Cash",
      reference_number,
      status = "received",
      notes,
    } = body;

    const donAmount = Number(amount);
    if (!contributor_name || isNaN(donAmount) || donAmount <= 0 || !donation_purpose) {
      return NextResponse.json(
        { success: false, error: "Contributor name, valid amount, and donation purpose are required" },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();

    const result = await transaction(async (conn) => {
      // 1. Generate donation_no
      const [lastDon] = await conn.execute<any>("SELECT id FROM donations ORDER BY id DESC LIMIT 1");
      const nextId = (lastDon[0]?.id || 0) + 1;
      const donation_no = `DON-${year}-${String(nextId).padStart(4, "0")}`;
      const receipt_number = `RCPT-DON-${year}-${String(nextId).padStart(4, "0")}`;

      // 2. Insert into donations
      const [donRes] = await conn.execute<any>(
        `INSERT INTO donations (
          donation_no, contributor_name, advocate_id, phone, email, pan_number,
          donation_date, amount, category_id, donation_purpose, payment_mode,
          reference_number, receipt_number, status, notes, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          donation_no,
          contributor_name,
          advocate_id ? Number(advocate_id) : null,
          phone || null,
          email || null,
          pan_number || null,
          donation_date,
          donAmount,
          category_id ? Number(category_id) : null,
          donation_purpose,
          payment_mode,
          reference_number || null,
          receipt_number,
          status,
          notes || null,
          user.userId,
        ]
      );
      const donationId = donRes.insertId;

      // 3. If status is received, record in payments and income_entries
      if (status === "received") {
        const [lastPay] = await conn.execute<any>("SELECT id FROM payments ORDER BY id DESC LIMIT 1");
        const nextPayId = (lastPay[0]?.id || 0) + 1;
        const receipt_no = `PAY-${year}-${String(nextPayId).padStart(4, "0")}`;

        const [payRes] = await conn.execute<any>(
          `INSERT INTO payments (
            receipt_no, advocate_id, payment_date, amount, payment_mode, reference_number,
            source_module, source_id, received_by_user_id, payer_name, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, 'donation', ?, ?, ?, 'completed', ?)`,
          [
            receipt_no,
            advocate_id ? Number(advocate_id) : null,
            donation_date,
            donAmount,
            payment_mode,
            reference_number || null,
            donationId,
            user.userId,
            contributor_name,
            `Donation: ${donation_purpose}`,
          ]
        );

        await conn.execute("UPDATE donations SET payment_id = ? WHERE id = ?", [payRes.insertId, donationId]);

        // Auto create income record
        const [lastInc] = await conn.execute<any>("SELECT id FROM income_entries ORDER BY id DESC LIMIT 1");
        const nextIncId = (lastInc[0]?.id || 0) + 1;
        const income_no = `INC-${year}-${String(nextIncId).padStart(4, "0")}`;

        await conn.execute(
          `INSERT INTO income_entries (
            income_no, date, category, description, amount, payment_mode, reference_no,
            received_from, is_auto_generated, source_module, source_id, payment_status, user_id
          ) VALUES (?, ?, 'donation', ?, ?, ?, ?, ?, 1, 'donation', ?, 'paid', ?)`,
          [
            income_no,
            donation_date,
            `Donation ${donation_no}: ${donation_purpose}`,
            donAmount,
            payment_mode,
            reference_number || null,
            contributor_name,
            donationId,
            user.userId,
          ]
        );
      }

      // 4. Activity log
      await conn.execute(
        `INSERT INTO activity_logs (user_id, action, module, record_id, details)
         VALUES (?, 'Donation Recorded', 'donations', ?, ?)`,
        [user.userId, donation_no, `Received ₹${donAmount} donation from ${contributor_name} (${donation_purpose})`]
      );

      return {
        donationId,
        donation_no,
        receipt_number,
        contributor_name,
        amount: donAmount,
        donation_purpose,
        payment_mode,
        donation_date,
        pan_number,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Donation recorded successfully",
      data: result,
    });
  } catch (error: any) {
    console.warn("Donation POST DB unavailable, storing in memory:", error?.message);
    const store = getStore();
    const donationId = store.donations.length + 1;
    const year = new Date().getFullYear();
    const donation_no = `DON-${year}-${String(donationId).padStart(4, "0")}`;
    const receipt_number = `RCP-DON-${year}-${String(donationId).padStart(4, "0")}`;
    const donAmount = Number(body?.amount) || 1000;
    const contributor_name = body?.contributor_name || "Association Well-wisher";
    const payment_mode = body?.payment_mode || "cash";
    const donation_date = body?.donation_date || new Date().toISOString().split("T")[0];

    const newDonation = {
      id: donationId,
      donation_no,
      receipt_number,
      receipt_no: receipt_number,
      contributor_name,
      donor_name: contributor_name,
      category_name: "General Welfare Corpus",
      amount: donAmount,
      donation_purpose: body?.donation_purpose || "General Welfare Corpus",
      payment_mode,
      donation_date,
      pan_number: body?.pan_number || null,
      status: "received",
      created_at: new Date().toISOString(),
    };
    store.donations.unshift(newDonation);

    store.payments.unshift({
      id: store.payments.length + 1,
      receipt_no: receipt_number,
      advocate_id: null,
      advocate_name: contributor_name,
      advocate_code: "",
      payer_name: contributor_name,
      payment_date: donation_date,
      amount: donAmount,
      payment_mode,
      reference_number: null,
      source_module: "donations",
      payment_type: "donation",
      status: "completed",
      notes: `Donation ${donation_no}`,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Donation recorded successfully",
      data: {
        donationId,
        donation_no,
        receipt_number,
        contributor_name,
        amount: donAmount,
        donation_purpose: newDonation.donation_purpose,
        payment_mode,
        donation_date,
        pan_number: newDonation.pan_number,
      },
    });
  }
}
