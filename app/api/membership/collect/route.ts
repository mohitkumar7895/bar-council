import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "membership:collect")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const {
      advocate_id,
      amount,
      payment_mode = "Cash",
      reference_number,
      payment_date = new Date().toISOString().split("T")[0],
      due_ids = [],
      notes,
    } = body;

    const paymentAmount = Number(amount);
    if (!advocate_id || isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid advocate and positive payment amount are required" },
        { status: 400 }
      );
    }

    const [advocates] = await query<any[]>(
      "SELECT id, full_name, advocate_code, phone FROM advocates WHERE id = ? LIMIT 1",
      [advocate_id]
    );

    if (!advocates) {
      return NextResponse.json({ success: false, error: "Advocate not found" }, { status: 404 });
    }

    const year = new Date().getFullYear();
    const result = await transaction(async (conn) => {
      // 1. Generate receipt number
      const [lastPay] = await conn.execute<any>(
        "SELECT id FROM payments ORDER BY id DESC LIMIT 1"
      );
      const nextId = (lastPay[0]?.id || 0) + 1;
      const receipt_no = `PAY-${year}-${String(nextId).padStart(4, "0")}`;

      // 2. Insert into payments
      const [payRes] = await conn.execute<any>(
        `INSERT INTO payments (
          receipt_no, advocate_id, payment_date, amount, payment_mode,
          reference_number, source_module, received_by_user_id, payer_name, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, 'membership', ?, ?, 'completed', ?)`,
        [
          receipt_no,
          advocate_id,
          payment_date,
          paymentAmount,
          payment_mode,
          reference_number || null,
          user.userId,
          advocates.full_name,
          notes || "Membership dues collection",
        ]
      );

      const paymentId = payRes.insertId;

      // 3. Allocate to dues
      let remainingToAllocate = paymentAmount;

      // If specific due_ids provided, use them; otherwise fetch unpaid dues for this advocate
      let duesToPay: any[] = [];
      if (due_ids.length > 0) {
        const placeholders = due_ids.map(() => "?").join(",");
        const [rows] = await conn.execute<any>(
          `SELECT id, amount, paid_amount FROM membership_dues WHERE id IN (${placeholders}) ORDER BY due_year ASC, due_month ASC, id ASC`,
          due_ids
        );
        duesToPay = rows;
      } else {
        const [rows] = await conn.execute<any>(
          `SELECT id, amount, paid_amount FROM membership_dues WHERE advocate_id = ? AND status != 'paid' ORDER BY due_year ASC, due_month ASC, id ASC`,
          [advocate_id]
        );
        duesToPay = rows;
      }

      for (const due of duesToPay) {
        if (remainingToAllocate <= 0) break;
        const dueBalance = Number(due.amount) - Number(due.paid_amount);
        const allocate = Math.min(remainingToAllocate, dueBalance);

        if (allocate > 0) {
          const newPaid = Number(due.paid_amount) + allocate;
          const newStatus = newPaid >= Number(due.amount) ? "paid" : "partial";

          // Update due
          await conn.execute(
            "UPDATE membership_dues SET paid_amount = ?, status = ? WHERE id = ?",
            [newPaid, newStatus, due.id]
          );

          // Insert allocation
          await conn.execute(
            "INSERT INTO payment_allocations (payment_id, due_id, allocated_amount) VALUES (?, ?, ?)",
            [paymentId, due.id, allocate]
          );

          remainingToAllocate -= allocate;
        }
      }

      // 4. Record corresponding income entry (prevent double-counting with source_module tracking)
      const [lastInc] = await conn.execute<any>(
        "SELECT id FROM income_entries ORDER BY id DESC LIMIT 1"
      );
      const nextIncId = (lastInc[0]?.id || 0) + 1;
      const income_no = `INC-${year}-${String(nextIncId).padStart(4, "0")}`;

      await conn.execute(
        `INSERT INTO income_entries (
          income_no, date, category, description, amount, payment_mode,
          reference_no, received_from, is_auto_generated, source_module, source_id, payment_status, user_id
        ) VALUES (?, ?, 'membership_fee', ?, ?, ?, ?, ?, 1, 'membership', ?, 'paid', ?)`,
        [
          income_no,
          payment_date,
          `Membership Dues Receipt ${receipt_no} from ${advocates.full_name}`,
          paymentAmount,
          payment_mode,
          reference_number || null,
          advocates.full_name,
          paymentId,
          user.userId,
        ]
      );

      // 5. Activity log
      await conn.execute(
        `INSERT INTO activity_logs (user_id, action, module, record_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [
          user.userId,
          "Collect Dues",
          "membership",
          receipt_no,
          `Collected ₹${paymentAmount} from ${advocates.full_name} (${advocates.advocate_code}) via ${payment_mode}`,
        ]
      );

      return {
        paymentId,
        receipt_no,
        advocate: advocates,
        amount: paymentAmount,
        payment_date,
        payment_mode,
        reference_number,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Payment successfully recorded and allocated to dues",
      data: result,
    });
  } catch (error: any) {
    console.error("Membership collect error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record payment" },
      { status: 500 }
    );
  }
}
