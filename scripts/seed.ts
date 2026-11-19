import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

async function seed() {
  console.log("Starting Bar Association Management System database seeding...");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "bar-council",
  });

  try {
    // 1. Users
    console.log("Seeding Users...");
    const adminPass = await bcrypt.hash("Admin@12345", 10);
    const secPass = await bcrypt.hash("Secretary@123", 10);
    const accPass = await bcrypt.hash("Accounts@123", 10);
    const staffPass = await bcrypt.hash("Staff@123", 10);
    const commPass = await bcrypt.hash("Committee@123", 10);

    const users = [
      [1, "Adv. Rajeshwar Sharma", "admin@districtbar.org.in", adminPass, "+91 9811122334", "active"],
      [2, "Adv. Manisha Rastogi", "secretary@districtbar.org.in", secPass, "+91 9822233445", "active"],
      [3, "Suresh Chandra Gupta", "accounts@districtbar.org.in", accPass, "+91 9833344556", "active"],
      [4, "Pooja Verma", "staff@districtbar.org.in", staffPass, "+91 9844455667", "active"],
      [5, "Adv. Harish Narang", "committee@districtbar.org.in", commPass, "+91 9855566778", "active"],
    ];

    for (const u of users) {
      await connection.execute(
        `INSERT INTO users (role_id, name, email, password_hash, phone, status)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash), role_id=VALUES(role_id), status=VALUES(status)`,
        u
      );
    }

    // 2. Advocates
    console.log("Seeding Advocates...");
    const advocatesData = [
      ["ADV-2026-0001", "Arun Kumar Aggarwal", "Late S. K. Aggarwal", "Chamber No. 42, Civil Wing, District Courts", "+91 9810112233", "arun.aggarwal@lawcorp.in", "D/1420/1998", "BAR-M-1042", "KN-9801", "Delhi Advocates Welfare Trust", "1998-07-15", "2027-03-31", "active", 5000.00, 100.00, 1200.00, "Senior Advocate Member, Civil & Criminal"],
      ["ADV-2026-0002", "Priyanka Mehra", "D. N. Mehra", "Flat 302, Palm Greens, Sector 14", "+91 9820223344", "priyanka.m@delhibar.org", "D/2890/2008", "BAR-M-2108", "KN-0812", "National Kalyan Kosh Enrolled", "2008-04-10", "2027-03-31", "active", 5000.00, 100.00, 1200.00, "Corporate & Commercial Law Specialist"],
      ["ADV-2026-0003", "Vikramaditya Chauhan", "Thakur Balram Chauhan", "Chamber No. 118, Criminal Side", "+91 9830334455", "vchauhan.adv@gmail.com", "D/0512/1992", "BAR-M-0512", "KN-9244", "State Apda Kosh Beneficiary", "1992-09-01", "2027-03-31", "active", 5000.00, 100.00, 1200.00, "Former Bar Council Executive Member"],
      ["ADV-2026-0004", "Sunita Deshmukh", "Prakash Deshmukh", "H-12, Lawyers Enclave, Rohini", "+91 9840445566", "sunita.deshmukh@justice.in", "D/3104/2012", "BAR-M-3104", "KN-1205", "All India Lawyers Welfare Scheme", "2012-08-20", "2027-03-31", "active", 5000.00, 100.00, 1200.00, "Family Court & Matrimonial Advocate"],
      ["ADV-2026-0005", "Mohammad Tariq Qureshi", "Abdul Gaffar Qureshi", "Chamber No. 89, Revenue Court Complex", "+91 9850556677", "tariq.legal@yahoo.com", "D/1780/2003", "BAR-M-1780", "KN-0399", "Apda Sahayata Fund", "2003-02-14", "2027-03-31", "active", 5000.00, 100.00, 1200.00, "Revenue, Property and Land Law"],
      ["ADV-2026-0006", "Deepak Verma", "Ram Gopal Verma", "B-44, Vikas Marg, Laxmi Nagar", "+91 9860667788", "deepak.verma@legalpoint.in", "D/4412/2018", "BAR-M-4412", "KN-1845", "State Bar Enrolment Benefit", "2018-11-05", "2027-03-31", "active", 5000.00, 100.00, 1200.00, "Motor Accident Claims & Insurance"],
      ["ADV-2026-0007", "Meenakshi Sundaram", "K. Sundaram", "Chamber 205, South Block Courts", "+91 9870778899", "meenakshi.s@advocate.in", "D/0932/1995", "BAR-M-0932", "KN-9533", "Advocate Pension & Welfare Trust", "1995-05-12", "2027-03-31", "active", 5000.00, 100.00, 1200.00, "Labour & Industrial Tribunal Practice"],
      ["ADV-2026-0008", "Gurpreet Singh Bhasin", "Jaswant Singh Bhasin", "45A, Model Town Part II", "+91 9880889900", "gsbhasin@juris chambers.com", "D/2215/2005", "BAR-M-2215", "KN-0578", "State Welfare Enrolled", "2005-03-22", "2026-03-31", "inactive", 5000.00, 100.00, 1200.00, "Annual renewal due pending"],
      ["ADV-2026-0009", "Late Rameshwar Nath Dave", "Bishambhar Nath Dave", "Old Judicial Quarters, Court Road", "+91 9890990011", "family.dave@gmail.com", "D/0234/1986", "BAR-M-0234", "KN-8610", "Trust Benefit Life Member", "1986-01-10", "2026-03-31", "deceased", 5000.00, 100.00, 1200.00, "Demised in Jan 2026, Death Claim in progress"],
      ["ADV-2026-0010", "Ananya Banerjee", "Subir Banerjee", "Chamber 71, High Court Bar Annex", "+91 9811001122", "ananya.banerjee@court.in", "D/5520/2021", "BAR-M-5520", "KN-2190", "Young Lawyers Welfare Scheme", "2021-09-18", "2027-03-31", "active", 5000.00, 100.00, 1200.00, "Constitutional & Civil Writs"],
    ];

    for (const a of advocatesData) {
      await connection.execute(
        `INSERT INTO advocates (
          advocate_code, full_name, father_name, address, phone, email,
          bar_council_reg_no, association_membership_no, kalyan_nidhi_no,
          apda_kosh_details, membership_start_date, renewal_date,
          membership_status, admission_fee, monthly_chanda, annual_dues, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), phone=VALUES(phone), membership_status=VALUES(membership_status)`,
        a
      );
    }

    // 3. Membership Dues & Payments
    console.log("Seeding Membership Dues & Collections...");
    const [advRows] = await connection.execute<any[]>("SELECT id, advocate_code, full_name, membership_status FROM advocates ORDER BY id ASC");
    const [periodRows] = await connection.execute<any[]>("SELECT id FROM membership_periods WHERE period_name='2026-2027'");
    const periodId = periodRows[0].id;

    for (let i = 0; i < advRows.length; i++) {
      const adv = advRows[i];
      if (adv.membership_status === "deceased") continue;

      // Annual due
      const isPaidAnnual = i % 2 === 0;
      await connection.execute(
        `INSERT INTO membership_dues (advocate_id, period_id, due_type, due_year, amount, paid_amount, status, due_date)
         VALUES (?, ?, 'annual_dues', 2026, 1200.00, ?, ?, '2026-04-30')`,
        [adv.id, periodId, isPaidAnnual ? 1200.00 : 0.00, isPaidAnnual ? "paid" : "unpaid"]
      );

      // Monthly chanda for months 4 (April) to 9 (September) 2026
      for (let m = 4; m <= 9; m++) {
        const isMonthPaid = i < 6 || (i % 3 === 0 && m < 7);
        await connection.execute(
          `INSERT INTO membership_dues (advocate_id, period_id, due_type, due_month, due_year, amount, paid_amount, status, due_date)
           VALUES (?, ?, 'monthly_chanda', ?, 2026, 100.00, ?, ?, ?)`,
          [adv.id, periodId, m, isMonthPaid ? 100.00 : 0.00, isMonthPaid ? "paid" : "unpaid", `2026-0${m}-10`]
        );
      }
    }

    // Record sample payment receipts
    await connection.execute(
      `INSERT INTO payments (receipt_no, advocate_id, payment_date, amount, payment_mode, reference_number, source_module, payer_name, status, notes)
       VALUES
       ('PAY-2026-0001', 1, '2026-04-05', 1800.00, 'UPI', 'UPI/260405/98231', 'membership', 'Arun Kumar Aggarwal', 'completed', 'Annual Dues + 6 Months Chanda'),
       ('PAY-2026-0002', 2, '2026-04-12', 1200.00, 'Bank Transfer', 'NEFT-ICICI-009812', 'membership', 'Priyanka Mehra', 'completed', 'Annual Dues 2026-2027'),
       ('PAY-2026-0003', 3, '2026-05-02', 1500.00, 'Cash', 'RCPT-003', 'membership', 'Vikramaditya Chauhan', 'completed', 'Annual Dues & 3 Months Chanda'),
       ('PAY-2026-0004', 4, '2026-06-15', 600.00, 'UPI', 'UPI/260615/11029', 'membership', 'Sunita Deshmukh', 'completed', 'April to September Chanda')
       ON DUPLICATE KEY UPDATE status=VALUES(status)`
    );

    // 4. Waqalatnama Sales
    console.log("Seeding Waqalatnama Sales...");
    const salesData = [
      ["WQS-2026-0001", "2026-05-10", 1, "Adv. Arun Kumar Aggarwal", 500.00, 0.00, 500.00, 500.00, 0.00, "Cash", "paid", "High Court Waqalatnama 10 Copies"],
      ["WQS-2026-0002", "2026-05-18", 2, "Adv. Priyanka Mehra", 600.00, 0.00, 600.00, 600.00, 0.00, "UPI", "paid", "District Court 20 Copies"],
      ["WQS-2026-0003", "2026-06-02", 5, "Adv. Mohammad Tariq Qureshi", 800.00, 50.00, 750.00, 750.00, 0.00, "Cash", "paid", "Tribunal Waqalatnama & Memo Pads"],
      ["WQS-2026-0004", "2026-06-14", 6, "Adv. Deepak Verma", 450.00, 0.00, 450.00, 450.00, 0.00, "UPI", "paid", "District Court Waqalatnama 15 Copies"],
    ];

    for (const s of salesData) {
      const [res] = await connection.execute<any>(
        `INSERT INTO waqalatnama_sales (sale_no, sale_date, advocate_id, customer_name, total_amount, discount, net_amount, amount_received, balance_amount, payment_mode, payment_status, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE customer_name=VALUES(customer_name)`,
        s
      );
      if (res.insertId) {
        await connection.execute(
          `INSERT INTO waqalatnama_sale_items (sale_id, item_id, quantity, unit_rate, total_amount)
           VALUES (?, 1, 5, 50.00, 250.00)`,
          [res.insertId]
        );
      }
    }

    // 5. Form Sales
    console.log("Seeding Form Sales...");
    const formSalesData = [
      ["FMS-2026-0001", "2026-05-12", 10, "Adv. Ananya Banerjee", 1, 2, 200.00, 400.00, 400.00, 0.00, "Cash", "paid", "Fresh Enrolment Form Kit"],
      ["FMS-2026-0002", "2026-05-25", 6, "Adv. Deepak Verma", 5, 1, 100.00, 100.00, 100.00, 0.00, "UPI", "paid", "Bar ID Card Application"],
      ["FMS-2026-0003", "2026-06-08", null, "Adv. R. K. Shrivastava (Applicant)", 1, 1, 200.00, 200.00, 200.00, 0.00, "Cash", "paid", "Membership Application Form"],
      ["FMS-2026-0004", "2026-06-20", 4, "Adv. Sunita Deshmukh", 3, 2, 100.00, 200.00, 200.00, 0.00, "Cash", "paid", "Welfare Fund Enrollment Forms"],
    ];

    for (const fs of formSalesData) {
      await connection.execute(
        `INSERT INTO form_sales (sale_no, sale_date, advocate_id, buyer_name, form_type_id, quantity, unit_price, total_amount, amount_received, balance_amount, payment_mode, payment_status, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE buyer_name=VALUES(buyer_name)`,
        fs
      );
    }

    // 6. Donations
    console.log("Seeding Donations...");
    const donationsData = [
      ["DON-2026-0001", "Senior Advocate Ashok Sen", 1, "9811199990", "ashoksen@lex.org", "AAAPA1234F", "2026-04-18", 50000.00, 1, "Bar Library Computerization & Digital Journal Setup", "Bank Transfer", "NEFT-HDFC-9921", "DN-REC-01", "received", "Donation for Law Library Upgrade"],
      ["DON-2026-0002", "Justice (Retd.) B. N. Kirpal Endowment", null, "9822288880", "trust@kirpallegal.org", "AABCT5678K", "2026-05-05", 100000.00, 2, "Annual Advocate Welfare & Demise Relief Fund", "Cheque", "CHQ-882190", "DN-REC-02", "received", "Corpus for distressed advocates"],
      ["DON-2026-0003", "Adv. Vikramaditya Chauhan", 3, "9830334455", "vchauhan.adv@gmail.com", "BCWPC9012M", "2026-05-22", 25000.00, 3, "Bar Association Conference Hall Renovation", "UPI", "UPI/260522/88123", "DN-REC-03", "received", "AC fitting and conference table support"],
    ];

    for (const d of donationsData) {
      await connection.execute(
        `INSERT INTO donations (donation_no, contributor_name, advocate_id, phone, email, pan_number, donation_date, amount, category_id, donation_purpose, payment_mode, reference_number, receipt_number, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE contributor_name=VALUES(contributor_name)`,
        d
      );
    }

    // 7. Death Benefit Claims
    console.log("Seeding Death Benefit Claims...");
    const deathClaims = [
      [
        "DBC-2026-0001", 9, "Late Rameshwar Nath Dave", "BAR-M-0234", "D/0234/1986", "2026-01-20",
        "Mrs. Sushila Dave", "Spouse / Legal Nominee", "+91 9890990011", "sushila.dave@gmail.com",
        "House 14, Judge Colony, Civil Lines", 500000.00, "2026-02-05",
        "disbursed", 500000.00, "2026-02-20", "2026-02-28", "Bank Transfer", "NEFT-SBI-44019283",
        "Death certificate, Bar council verification, and nominee succession certificate all verified by committee. Disbursed via RTGS.",
      ],
      [
        "DBC-2026-0002", 8, "Gurpreet Singh Bhasin", "BAR-M-2215", "D/2215/2005", "2026-05-14",
        "Harpreet Kaur Bhasin", "Wife / Nominee", "+91 9880889900", "harpreet.bhasin@gmail.com",
        "45A, Model Town Part II", 500000.00, "2026-05-28",
        "under_review", 0.00, null, null, null, null,
        "Application received with death summary and hospital record. Awaiting formal municipal death certificate and succession deed.",
      ],
    ];

    for (const dc of deathClaims) {
      await connection.execute(
        `INSERT INTO death_benefit_claims (
          claim_no, advocate_id, deceased_advocate_name, membership_no, registration_no, date_of_death,
          applicant_name, relationship, phone, email, address, requested_amount, application_date,
          claim_status, sanctioned_amount, approval_date, disbursement_date, payment_mode, bank_reference_no,
          reviewer_remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE applicant_name=VALUES(applicant_name)`,
        dc
      );
    }

    // 8. Health Claims
    console.log("Seeding Health Claims...");
    const healthClaims = [
      [
        "HLC-2026-0001", 3, "Vikramaditya Chauhan", "self", 3, 75000.00, "2026-04-10",
        "Max Super Speciality Hospital, Saket", "Coronary Angioplasty with stent placement", "2026-03-25", "2026-03-30",
        "HDFC Bank", "50100234129801", "HDFC0000123",
        "verified", "approved", 75000.00, "2026-04-20", "2026-04-25", "Bank Transfer", "NEFT-HDFC-990182",
        "Hospital discharge summary, original bills, and cardiologist prescription verified by Medical Welfare Committee.",
      ],
      [
        "HLC-2026-0002", 4, "Sunita Deshmukh", "parent", 4, 30000.00, "2026-05-15",
        "Fortis Escorts Hospital", "Father hospitalized for severe pneumonia & respiratory distress", "2026-05-02", "2026-05-08",
        "State Bank of India", "309988112233", "SBIN0001144",
        "in_progress", "under_review", 0.00, null, null, null, null,
        "Original medical bills submitted. Reviewing dependency eligibility under Bar Association Welfare bylaws.",
      ],
    ];

    for (const hc of healthClaims) {
      await connection.execute(
        `INSERT INTO health_claims (
          claim_no, advocate_id, applicant_name, relationship, category_id, requested_amount, submission_date,
          hospital_name, illness_details, admission_date, discharge_date, bank_name, account_number, ifsc_code,
          verification_status, claim_status, sanctioned_amount, approval_date, disbursement_date, payment_mode,
          bank_reference_no, reviewer_remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE applicant_name=VALUES(applicant_name)`,
        hc
      );
    }

    // 9. Association Legal & Case Register
    console.log("Seeding Cases Register...");
    const cases = [
      ["CAS-2026-0001", "REF/BAR/2026/01", "disciplinary", "District Bar Association Grievance Committee", "Adv. S. K. Mittal", 6, "2026-04-12", "hearing", "Hon'ble Vice President, DBA", "Matter concerning court decorum and chamber space dispute", "Under active conciliation"],
      ["CAS-2026-0002", "REF/BAR/2026/02", "welfare_appeal", "Adv. Gurpreet Singh Bhasin", "Welfare Committee", 8, "2026-05-02", "resolved", "President, DBA", "Appeal against membership subscription late fine penalty", "Penalty waived on humanitarian ground"],
    ];

    for (const c of cases) {
      await connection.execute(
        `INSERT INTO cases_register (case_no, reference_number, category, applicant_name, respondent_name, advocate_id, filing_date, status, presiding_officer, notes, outcome)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE applicant_name=VALUES(applicant_name)`,
        c
      );
    }

    // 10. Financial Entries (Income & Expenses)
    console.log("Seeding Income & Expenses...");
    const expenses = [
      ["EXP-2026-0001", "2026-04-05", 1, "Stationery, Register printing, Office papers and cartridges", 12500.00, "Cash", "M/s Royal Printers & Stationers", "BILL-4019", "paid", "Quarterly stationary supply"],
      ["EXP-2026-0002", "2026-04-15", 3, "AIR, SCC Online, and LexisNexis Annual Digital Law Subscriptions", 65000.00, "Bank Transfer", "Eastern Book Company & LexisNexis", "INV-2026-902", "paid", "Digital Library renewal 2026-2027"],
      ["EXP-2026-0003", "2026-04-30", 2, "Office Bar Staff honorarium, library attendant, clerk salary (April)", 38000.00, "Bank Transfer", "Staff Payroll (3 Staff members)", "PAY-APR-2026", "paid", "April 2026 staff salaries"],
      ["EXP-2026-0004", "2026-05-15", 7, "Bar Room water cooler installation and air conditioner servicing", 18500.00, "UPI", "Shri Ganesh Electricals", "INV-8891", "paid", "Summer electrical servicing"],
      ["EXP-2026-0005", "2026-05-31", 2, "Office Bar Staff honorarium and clerk remuneration (May)", 38000.00, "Bank Transfer", "Staff Payroll (3 Staff members)", "PAY-MAY-2026", "paid", "May 2026 staff salaries"],
    ];

    for (const exp of expenses) {
      await connection.execute(
        `INSERT INTO expense_entries (expense_no, date, category_id, description, amount, payment_mode, payee_vendor, reference_number, payment_status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE description=VALUES(description)`,
        exp
      );
    }

    // Seed Income entries matching collections
    const incomeEntries = [
      ["INC-2026-0001", "2026-04-05", "membership_fee", "Advocate Annual & Monthly Dues Collections", 5100.00, "UPI", "UPI/260405/98231", "Multiple Advocates", 1, "membership", 1, "paid"],
      ["INC-2026-0002", "2026-04-18", "donation", "Bar Library Computerization Donation", 50000.00, "Bank Transfer", "NEFT-HDFC-9921", "Adv. Ashok Sen", 0, "donation", 1, "paid"],
      ["INC-2026-0003", "2026-05-10", "waqalatnama_sales", "High Court Waqalatnama Sale (WQS-2026-0001)", 500.00, "Cash", "REC-01", "Adv. Arun Kumar Aggarwal", 1, "waqalatnama", 1, "paid"],
      ["INC-2026-0004", "2026-05-12", "form_sales", "Fresh Enrolment Form Kit Sale (FMS-2026-0001)", 400.00, "Cash", "FMS-REC-01", "Adv. Ananya Banerjee", 1, "form_sales", 1, "paid"],
      ["INC-2026-0005", "2026-05-05", "donation", "Endowment Contribution for Welfare Fund", 100000.00, "Cheque", "CHQ-882190", "Justice (Retd.) B. N. Kirpal", 0, "donation", 2, "paid"],
    ];

    for (const inc of incomeEntries) {
      await connection.execute(
        `INSERT INTO income_entries (income_no, date, category, description, amount, payment_mode, reference_no, received_from, is_auto_generated, source_module, source_id, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE description=VALUES(description)`,
        inc
      );
    }

    // 11. Activity Logs
    console.log("Seeding Activity Logs...");
    await connection.execute(
      `INSERT INTO activity_logs (user_id, action, module, record_id, details)
       VALUES
       (1, 'System Initialization', 'settings', 'SYS', 'System master configuration, permissions, and roles initialized'),
       (1, 'Advocate Registration', 'advocates', 'ADV-2026-0001', 'Registered Adv. Arun Kumar Aggarwal with Bar Council ID D/1420/1998'),
       (2, 'Claim Approved', 'death_benefit', 'DBC-2026-0001', 'Approved death benefit claim for late Rameshwar Nath Dave - Sanctioned ₹5,00,000'),
       (3, 'Payment Collection', 'membership', 'PAY-2026-0001', 'Collected ₹1800 from Adv. Arun Kumar Aggarwal via UPI'),
       (3, 'Waqalatnama Sale', 'waqalatnama', 'WQS-2026-0001', 'Recorded sale of 10 High Court Waqalatnama to Adv. Arun Kumar Aggarwal')`
    );

    console.log("Database seeded successfully with authentic production-grade records!");
  } catch (err) {
    console.error("Error seeding database:", err);
    throw err;
  } finally {
    await connection.end();
  }
}

seed();
