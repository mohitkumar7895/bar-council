import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized", unauthenticated: true }, { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "year"; // 'today' | 'month' | 'year' | 'all'

    // Execute all dashboard queries in parallel using Promise.all for maximum speed
    const [
      [advCounts],
      [duesSummary],
      [wqtSummary],
      [formSummary],
      [donSummary],
      [deathClaimsSummary],
      [healthClaimsSummary],
      [financeSummary],
      monthlyCollections,
      incomeExpenseTrend,
      recentPayments,
      recentActivities,
      pendingClaims,
    ] = await Promise.all([
      // 1. Advocate counts
      query<any[]>(`
        SELECT
          COUNT(*) as total_advocates,
          SUM(CASE WHEN membership_status = 'active' THEN 1 ELSE 0 END) as active_advocates,
          SUM(CASE WHEN membership_status = 'inactive' THEN 1 ELSE 0 END) as inactive_advocates,
          SUM(CASE WHEN membership_status = 'deceased' THEN 1 ELSE 0 END) as deceased_advocates
        FROM advocates
      `),

      // 2. Membership dues & collections
      query<any[]>(`
        SELECT
          COALESCE(SUM(paid_amount), 0) as total_dues_collected,
          COALESCE(SUM(amount - paid_amount), 0) as outstanding_dues
        FROM membership_dues
      `),

      // 3. Waqalatnama Stock & Sales
      query<any[]>(`
        SELECT
          (SELECT COALESCE(SUM(current_stock), 0) FROM waqalatnama_items WHERE is_active = 1) as waqalatnama_stock_balance,
          (SELECT COALESCE(SUM(amount_received), 0) FROM waqalatnama_sales) as waqalatnama_total_sales,
          (SELECT COALESCE(SUM(quantity), 0) FROM waqalatnama_sale_items) as waqalatnama_units_sold
      `),

      // 4. Form Sales
      query<any[]>(`
        SELECT
          COALESCE(SUM(amount_received), 0) as form_total_sales,
          COALESCE(SUM(quantity), 0) as form_units_sold
        FROM form_sales
      `),

      // 5. Donations
      query<any[]>(`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'received' THEN amount ELSE 0 END), 0) as total_donations,
          COUNT(CASE WHEN status = 'received' THEN 1 ELSE NULL END) as donation_count
        FROM donations
      `),

      // 6. Death Benefit Claims
      query<any[]>(`
        SELECT
          COUNT(CASE WHEN claim_status IN ('submitted', 'under_review', 'documents_pending') THEN 1 ELSE NULL END) as pending_death_claims,
          COUNT(CASE WHEN claim_status = 'approved' THEN 1 ELSE NULL END) as approved_death_claims,
          COUNT(CASE WHEN claim_status = 'disbursed' THEN 1 ELSE NULL END) as disbursed_death_claims,
          COALESCE(SUM(CASE WHEN claim_status = 'disbursed' THEN sanctioned_amount ELSE 0 END), 0) as disbursed_death_amount
        FROM death_benefit_claims
      `),

      // 7. Health Claims
      query<any[]>(`
        SELECT
          COUNT(CASE WHEN claim_status IN ('submitted', 'under_review', 'documents_pending') THEN 1 ELSE NULL END) as pending_health_claims,
          COUNT(CASE WHEN claim_status = 'approved' THEN 1 ELSE NULL END) as approved_health_claims,
          COUNT(CASE WHEN claim_status = 'disbursed' THEN 1 ELSE NULL END) as disbursed_health_claims,
          COALESCE(SUM(CASE WHEN claim_status = 'disbursed' THEN sanctioned_amount ELSE 0 END), 0) as disbursed_health_amount
        FROM health_claims
      `),

      // 8. Finance totals
      query<any[]>(`
        SELECT
          (SELECT COALESCE(SUM(amount), 0) FROM income_entries WHERE payment_status = 'paid') as total_income,
          (SELECT COALESCE(SUM(amount), 0) FROM expense_entries WHERE payment_status = 'paid') as total_expenses,
          (SELECT COALESCE(SUM(amount), 0) FROM fund_disbursements) as total_disbursements
      `),

      // 9. Monthly Collection chart data (last 6-8 months)
      query<any[]>(`
        SELECT
          DATE_FORMAT(payment_date, '%b %Y') as month,
          DATE_FORMAT(payment_date, '%Y-%m') as sort_key,
          COALESCE(SUM(amount), 0) as collection
        FROM payments
        WHERE status = 'completed'
        GROUP BY month, sort_key
        ORDER BY sort_key ASC
        LIMIT 8
      `),

      // 10. Income vs Expense Trend
      query<any[]>(`
        SELECT
          months.m_label as month,
          COALESCE(inc.total, 0) as income,
          COALESCE(exp.total, 0) as expense
        FROM (
          SELECT DISTINCT DATE_FORMAT(date, '%b %Y') as m_label, DATE_FORMAT(date, '%Y-%m') as s_key FROM income_entries
          UNION
          SELECT DISTINCT DATE_FORMAT(date, '%b %Y') as m_label, DATE_FORMAT(date, '%Y-%m') as s_key FROM expense_entries
        ) months
        LEFT JOIN (
          SELECT DATE_FORMAT(date, '%Y-%m') as s_key, SUM(amount) as total
          FROM income_entries WHERE payment_status = 'paid' GROUP BY s_key
        ) inc ON months.s_key = inc.s_key
        LEFT JOIN (
          SELECT DATE_FORMAT(date, '%Y-%m') as s_key, SUM(amount) as total
          FROM expense_entries WHERE payment_status = 'paid' GROUP BY s_key
        ) exp ON months.s_key = exp.s_key
        ORDER BY months.s_key ASC
        LIMIT 6
      `),

      // 11. Recent Transactions
      query<any[]>(`
        SELECT
          p.id, p.receipt_no, p.payment_date, p.amount, p.payment_mode,
          p.source_module, p.payer_name, p.status,
          a.full_name as advocate_name, a.advocate_code
        FROM payments p
        LEFT JOIN advocates a ON p.advocate_id = a.id
        ORDER BY p.payment_date DESC, p.id DESC
        LIMIT 6
      `),

      // 12. Recent Activities
      query<any[]>(`
        SELECT
          l.id, l.action, l.module, l.record_id, l.details, l.created_at,
          u.name as user_name
        FROM activity_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
        LIMIT 6
      `),

      // 13. Pending Applications
      query<any[]>(`
        SELECT
          'Death Benefit' as claim_type,
          claim_no,
          deceased_advocate_name as subject_name,
          requested_amount,
          application_date as date,
          claim_status as status
        FROM death_benefit_claims
        WHERE claim_status IN ('submitted', 'under_review', 'documents_pending')
        UNION ALL
        SELECT
          'Health Claim' as claim_type,
          claim_no,
          applicant_name as subject_name,
          requested_amount,
          submission_date as date,
          claim_status as status
        FROM health_claims
        WHERE claim_status IN ('submitted', 'under_review', 'documents_pending')
        ORDER BY date DESC
        LIMIT 5
      `),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        advocates: {
          total: Number(advCounts[0]?.total_advocates) || 0,
          active: Number(advCounts[0]?.active_advocates) || 0,
          inactive: Number(advCounts[0]?.inactive_advocates) || 0,
          deceased: Number(advCounts[0]?.deceased_advocates) || 0,
        },
        dues: {
          collected: Number(duesSummary[0]?.total_dues_collected) || 0,
          outstanding: Number(duesSummary[0]?.outstanding_dues) || 0,
        },
        waqalatnama: {
          stockBalance: Number(wqtSummary[0]?.waqalatnama_stock_balance) || 0,
          totalSales: Number(wqtSummary[0]?.waqalatnama_total_sales) || 0,
          unitsSold: Number(wqtSummary[0]?.waqalatnama_units_sold) || 0,
        },
        formSales: {
          totalSales: Number(formSummary[0]?.form_total_sales) || 0,
          unitsSold: Number(formSummary[0]?.form_units_sold) || 0,
        },
        donations: {
          total: Number(donSummary[0]?.total_donations) || 0,
          count: Number(donSummary[0]?.donation_count) || 0,
        },
        deathClaims: {
          pending: Number(deathClaimsSummary[0]?.pending_death_claims) || 0,
          approved: Number(deathClaimsSummary[0]?.approved_death_claims) || 0,
          disbursed: Number(deathClaimsSummary[0]?.disbursed_death_claims) || 0,
          disbursedAmount: Number(deathClaimsSummary[0]?.disbursed_death_amount) || 0,
        },
        healthClaims: {
          pending: Number(healthClaimsSummary[0]?.pending_health_claims) || 0,
          approved: Number(healthClaimsSummary[0]?.approved_health_claims) || 0,
          disbursed: Number(healthClaimsSummary[0]?.disbursed_health_claims) || 0,
          disbursedAmount: Number(healthClaimsSummary[0]?.disbursed_health_amount) || 0,
        },
        finance: {
          income: Number(financeSummary[0]?.total_income) || 0,
          expenses: Number(financeSummary[0]?.total_expenses) || 0,
          disbursements: Number(financeSummary[0]?.total_disbursements) || 0,
          netBalance:
            (Number(financeSummary[0]?.total_income) || 0) -
            (Number(financeSummary[0]?.total_expenses) || 0),
        },
        charts: {
          monthlyCollections,
          incomeExpenseTrend,
        },
        recentPayments,
        recentActivities,
        pendingClaims,
      },
    });
  } catch (error: any) {
    console.warn("Dashboard stats DB query unavailable, calculating from live store:", error?.message);
    const store = getStore();

    const totalAdvocates = store.advocates.length;
    const activeAdvocates = store.advocates.filter((a) => a.membership_status === "active").length;
    const inactiveAdvocates = store.advocates.filter((a) => a.membership_status === "inactive").length;
    const deceasedAdvocates = store.advocates.filter((a) => a.membership_status === "deceased").length;

    const totalDuesCollected = store.payments
      .filter((p) => p.payment_type === "membership_dues" || p.source_module === "membership")
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const outstandingDues = store.membershipDues.reduce(
      (sum, d) => sum + Math.max(0, (Number(d.amount) || 0) - (Number(d.paid_amount) || 0)),
      0
    );

    const waqalatnamaStock = store.waqalatnamaItems.reduce((sum, i) => sum + (Number(i.current_stock) || 0), 0);
    const waqalatnamaTotalSales = store.waqalatnamaSales.reduce((sum, s) => sum + (Number(s.amount_received || s.netTotal) || 0), 0);
    const waqalatnamaUnitsSold = store.waqalatnamaSales.reduce((sum, s) => sum + (Number(s.quantity) || 1), 0);

    const formTotalSales = store.formSales.reduce((sum, s) => sum + (Number(s.amount_received || s.total_amount) || 0), 0);
    const formUnitsSold = store.formSales.reduce((sum, s) => sum + (Number(s.quantity) || 1), 0);

    const totalDonations = store.donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    const donationCount = store.donations.length;

    const pendingDeathClaims = store.deathClaims.filter((c) => ["submitted", "under_review", "documents_pending"].includes(c.claim_status)).length;
    const approvedDeathClaims = store.deathClaims.filter((c) => c.claim_status === "approved").length;
    const disbursedDeathClaims = store.deathClaims.filter((c) => c.claim_status === "disbursed").length;
    const disbursedDeathAmount = store.deathClaims
      .filter((c) => c.claim_status === "disbursed")
      .reduce((sum, c) => sum + (Number(c.sanctioned_amount) || 0), 0);

    const pendingHealthClaims = store.healthClaims.filter((c) => ["submitted", "under_review", "documents_pending"].includes(c.claim_status)).length;
    const approvedHealthClaims = store.healthClaims.filter((c) => c.claim_status === "approved").length;
    const disbursedHealthClaims = store.healthClaims.filter((c) => c.claim_status === "disbursed").length;
    const disbursedHealthAmount = store.healthClaims
      .filter((c) => c.claim_status === "disbursed")
      .reduce((sum, c) => sum + (Number(c.sanctioned_amount) || 0), 0);

    const totalIncome = store.incomeEntries.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) + totalDuesCollected + waqalatnamaTotalSales + formTotalSales + totalDonations;
    const totalExpenses = store.expenseEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) + disbursedDeathAmount + disbursedHealthAmount;

    return NextResponse.json({
      success: true,
      data: {
        advocates: {
          total: totalAdvocates,
          active: activeAdvocates,
          inactive: inactiveAdvocates,
          deceased: deceasedAdvocates,
        },
        dues: {
          collected: totalDuesCollected,
          outstanding: outstandingDues,
        },
        waqalatnama: {
          stockBalance: waqalatnamaStock,
          totalSales: waqalatnamaTotalSales,
          unitsSold: waqalatnamaUnitsSold,
        },
        formSales: {
          totalSales: formTotalSales,
          unitsSold: formUnitsSold,
        },
        donations: {
          total: totalDonations,
          count: donationCount,
        },
        deathClaims: {
          pending: pendingDeathClaims,
          approved: approvedDeathClaims,
          disbursed: disbursedDeathClaims,
          disbursedAmount: disbursedDeathAmount,
        },
        healthClaims: {
          pending: pendingHealthClaims,
          approved: approvedHealthClaims,
          disbursed: disbursedHealthClaims,
          disbursedAmount: disbursedHealthAmount,
        },
        finance: {
          income: totalIncome,
          expenses: totalExpenses,
          disbursements: disbursedDeathAmount + disbursedHealthAmount,
          netBalance: totalIncome - totalExpenses,
        },
        charts: {
          monthlyCollections: [],
          incomeExpenseTrend: [],
        },
        recentPayments: store.payments.slice(0, 5),
        recentActivities: [],
        pendingClaims: [
          ...store.deathClaims.filter(c => ["submitted", "under_review"].includes(c.claim_status)).map(c => ({
            type: "death",
            claim_no: c.claim_no,
            subject_name: c.deceased_advocate_name,
            requested_amount: c.sanctioned_amount,
            date: c.application_date,
            status: c.claim_status,
          })),
          ...store.healthClaims.filter(c => ["submitted", "under_review"].includes(c.claim_status)).map(c => ({
            type: "health",
            claim_no: c.claim_no,
            subject_name: c.applicant_name,
            requested_amount: c.claimed_amount,
            date: c.submission_date,
            status: c.claim_status,
          })),
        ],
      },
    });
  }
}
