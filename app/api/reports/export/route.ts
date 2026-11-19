import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user || !hasPermission(user, "reports:export")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "advocates"; // advocates, dues, sales, finance, donations, claims
    const format = searchParams.get("format") || "xlsx"; // xlsx or csv

    let sheetData: any[] = [];
    let fileName = `Bar_Report_${type}_${Date.now()}`;

    if (type === "advocates") {
      fileName = "Advocate_Directory_Report";
      sheetData = await query<any[]>(`
        SELECT
          advocate_code AS 'Advocate ID',
          full_name AS 'Full Name',
          father_name AS 'Father Name',
          bar_council_reg_no AS 'Bar Council Reg No',
          association_membership_no AS 'Membership No',
          kalyan_nidhi_no AS 'Kalyan Nidhi No',
          phone AS 'Phone Number',
          email AS 'Email',
          membership_status AS 'Status',
          DATE_FORMAT(membership_start_date, '%d-%m-%Y') AS 'Enrolment Date',
          admission_fee AS 'Admission Fee',
          annual_dues AS 'Annual Dues',
          monthly_chanda AS 'Monthly Chanda'
        FROM advocates
        ORDER BY id ASC
      `);
    } else if (type === "dues") {
      fileName = "Membership_Dues_Report";
      sheetData = await query<any[]>(`
        SELECT
          a.advocate_code AS 'Advocate ID',
          a.full_name AS 'Advocate Name',
          a.bar_council_reg_no AS 'Bar Reg No',
          mp.period_name AS 'Period',
          md.due_type AS 'Due Type',
          md.due_month AS 'Month',
          md.due_year AS 'Year',
          md.amount AS 'Due Amount',
          md.paid_amount AS 'Paid Amount',
          (md.amount - md.paid_amount) AS 'Outstanding',
          md.status AS 'Status'
        FROM membership_dues md
        JOIN advocates a ON md.advocate_id = a.id
        LEFT JOIN membership_periods mp ON md.period_id = mp.id
        ORDER BY md.due_year DESC, md.due_month DESC
      `);
    } else if (type === "sales") {
      fileName = "Waqalatnama_Sales_Report";
      sheetData = await query<any[]>(`
        SELECT
          ws.sale_no AS 'Sale No',
          DATE_FORMAT(ws.sale_date, '%d-%m-%Y') AS 'Sale Date',
          ws.customer_name AS 'Customer / Advocate',
          ws.total_amount AS 'Gross Amount',
          ws.discount AS 'Discount',
          ws.net_amount AS 'Net Amount',
          ws.amount_received AS 'Amount Received',
          ws.balance_amount AS 'Balance',
          ws.payment_mode AS 'Payment Mode',
          ws.payment_status AS 'Payment Status'
        FROM waqalatnama_sales ws
        ORDER BY ws.sale_date DESC
      `);
    } else if (type === "finance") {
      fileName = "Income_Expenses_Report";
      const incomes = await query<any[]>(`
        SELECT
          'Income' AS 'Type',
          income_no AS 'Voucher No',
          DATE_FORMAT(date, '%d-%m-%Y') AS 'Date',
          category AS 'Category',
          description AS 'Description',
          amount AS 'Amount',
          payment_mode AS 'Payment Mode',
          received_from AS 'Party / Payee'
        FROM income_entries
      `);

      const expenses = await query<any[]>(`
        SELECT
          'Expense' AS 'Type',
          ee.expense_no AS 'Voucher No',
          DATE_FORMAT(ee.date, '%d-%m-%Y') AS 'Date',
          ec.name AS 'Category',
          ee.description AS 'Description',
          ee.amount AS 'Amount',
          ee.payment_mode AS 'Payment Mode',
          ee.payee_vendor AS 'Party / Payee'
        FROM expense_entries ee
        JOIN expense_categories ec ON ee.category_id = ec.id
      `);

      sheetData = [...incomes, ...expenses];
    } else if (type === "claims") {
      fileName = "Welfare_Claims_Report";
      const death = await query<any[]>(`
        SELECT
          'Death Benefit' AS 'Claim Type',
          claim_no AS 'Claim No',
          deceased_advocate_name AS 'Member Name',
          applicant_name AS 'Applicant Nominee',
          relationship AS 'Relationship',
          requested_amount AS 'Requested Amount',
          sanctioned_amount AS 'Sanctioned Amount',
          claim_status AS 'Status',
          DATE_FORMAT(application_date, '%d-%m-%Y') AS 'Date'
        FROM death_benefit_claims
      `);

      const health = await query<any[]>(`
        SELECT
          'Health Claim' AS 'Claim Type',
          claim_no AS 'Claim No',
          applicant_name AS 'Member Name',
          applicant_name AS 'Applicant Nominee',
          relationship AS 'Relationship',
          requested_amount AS 'Requested Amount',
          sanctioned_amount AS 'Sanctioned Amount',
          claim_status AS 'Status',
          DATE_FORMAT(submission_date, '%d-%m-%Y') AS 'Date'
        FROM health_claims
      `);

      sheetData = [...death, ...health];
    } else if (type === "donations") {
      fileName = "Donations_Report";
      sheetData = await query<any[]>(`
        SELECT
          donation_no AS 'Donation No',
          contributor_name AS 'Contributor Name',
          pan_number AS 'PAN No',
          phone AS 'Phone',
          amount AS 'Amount',
          donation_purpose AS 'Purpose',
          payment_mode AS 'Payment Mode',
          receipt_number AS 'Receipt No',
          status AS 'Status',
          DATE_FORMAT(donation_date, '%d-%m-%Y') AS 'Date'
        FROM donations
      `);
    }

    // Build workbook
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}.csv"`,
        },
      });
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ success: false, error: "Report generation failed" }, { status: 500 });
  }
}
