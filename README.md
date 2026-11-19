# Bar Association Management System (BAMS)

A complete, professional, production-ready enterprise management platform for Bar Associations and Bar Councils. Built with Next.js 15+ (App Router), TypeScript, Tailwind CSS, and MySQL (`mysql2`).

---

## 🏛️ System Features & Modules

### 1. Authentication & Role-Based Access Control (RBAC)
- **Secure Authentication:** AES-256 JWT sessions in HttpOnly, secure cookies, bcrypt password hashing.
- **5 Granular Roles:**
  1. **Super Admin:** Full system control, role permissions, user management, and system master settings.
  2. **Administrator / Secretary:** Advocate directory, membership, welfare claims review, sales, and operational reports.
  3. **Accounts / Finance:** Dues collections, income, expense vouchers, sanctioned fund disbursements, and financial audit ledgers.
  4. **Data Entry / Office Staff:** Advocate registration, Waqalatnama sales, form sales, and claim application intake.
  5. **Read-only / Committee User:** Permitted executive dashboard viewing, directories, and reports without editing rights.

---

### 2. Executive Analytics Dashboard
- **Real-Time MySQL Aggregations:** Calculated directly from active database records (never hardcoded/mocked).
- **Summary Cards:** Total Advocates, Active/Inactive counts, Fees Collected vs Outstanding Dues, Waqalatnama Sales & Stock, Form Sales, Donations, Death Benefit & Health Claims, Total Income, Expenses, and Net Surplus.
- **Interactive Visualizations:**
  - Month-wise collection trends (Recharts).
  - Income vs Expenses grouped comparisons.
- **Feeds:** Recent financial receipts, pending claims requiring immediate committee scrutiny, and audit logs.
- **Quick Action Triggers:** One-click modals to register advocates, collect dues, issue Waqalatnama, file claims, and post expenses.

---

### 3. Advocate Directory & Profile Management
- Auto-generated Advocate Codes (`ADV-YYYY-XXXX`).
- Full records: Bar Council Registration No., Association Membership No., Kalyan Nidhi No., Apda Kosh details, enrolment and renewal dates.
- Duplicate prevention for registration and membership numbers.
- **Full Master Profile View:**
  - Official Bar Enrolment ID card.
  - Advocate-wise subscription and dues ledger.
  - Advocate-wise Waqalatnama sales history.
  - Welfare claims history.
  - One-click print-ready profile sheet (`@media print`).

---

### 4. Membership Dues, Monthly Chanda & Annual Fees
- Multi-period support (2025–2026, 2026–2027).
- Configurable Annual Dues and January–December Monthly Chanda tracking.
- Dues status: `unpaid`, `partial`, `paid`, `waived`.
- **Collect Dues Modal:** Atomic payment recording, dues allocation, receipt generation, and general ledger posting without double-counting.
- **Batch Generation:** Mass-generate monthly chanda or annual dues for all active advocates.
- Official printable payment receipt vouchers.

---

### 5. Waqalatnama Stock & Sales Management
- Item Master: High Court Waqalatnama, District Court Waqalatnama, Tribunal & Revenue Waqalatnama, Memo of Appearance.
- **Atomic MySQL Transactions:** Verifies stock availability, decrements inventory, and logs stock movements (`opening`, `received`, `sale`, `adjustment`, `return`).
- Prevents negative stock.
- Low-stock visual threshold alerts.
- Issue sales to advocate members or counter walk-ins with instant printable sales receipts.

---

### 6. Form Sales Management
- Form Types Master: New Membership Application Kits, NOC/Transfer Certificates, Welfare Enrolment Forms, Claim Application Forms, Smart Bar ID Forms.
- Stock movements & counter sales register with receipt generation.

---

### 7. Donations & Welfare Corpus Contributions
- Contributor directory with PAN numbers, contacts, and donor categories.
- Tracks unrestricted corpus, library development, and distressed advocate welfare funds.
- Issue official voluntary donation acknowledgment receipts.

---

### 8. Death Benefit Fund Management
- **5-Stage Approval Workflow:** `Submitted` ➔ `Under Review` ➔ `Documents Pending` ➔ `Approved` / `Rejected` ➔ `Disbursed`.
- Records deceased advocate details, date of demise, nominee details, and requested assistance.
- Committee review remarks and relief sanctioning.
- **Disbursement Workflow:** Records payment instrument (RTGS / NEFT / Cheque), bank UTR reference, updates claim status to `disbursed`, and posts expense voucher to financial ledger.

---

### 9. Health Claim Management
- Covers advocates and dependent family members (Self, Spouse, Child, Parent, Dependent).
- Records hospital name, illness/surgery details, admission/discharge dates, and beneficiary bank details (Bank, Account No, IFSC).
- Document checklist verification: `pending`, `in_progress`, `verified`, `rejected`.
- Workflow approval and bank UTR disbursement tracking.

---

### 10. Secure Document Management Repository
- Encrypted file storage on server disk with metadata tracked in MySQL.
- Categorized by Bar Council Certificates, Identity Proofs, Court IDs, Meeting Minutes, and Notices.
- **Authenticated Download Endpoint (`/api/documents/[id]/download`):** Restricts file access to authorized users (no direct public asset exposure).

---

### 11. Cases & Disputes Register
- Association register for chamber allocations, seat disputes, disciplinary inquiries, and appeals.
- Presiding officer notes, hearing schedules, and outcome orders.

---

### 12. Centralized Payments, Income & Expenses
- **Payments Ledger:** Consolidated ledger of all collections across all modules.
- **Income & Expenses:** General ledger categorizing all revenues and operational expenditures. Prevents double-counting with source module tracking.
- Real-time calculation of net operating balance / reserves.

---

### 13. MIS Reports & Data Export
- 6 Pre-configured audit reports:
  1. Advocates Directory Report
  2. Membership Dues & Arrears Report
  3. Waqalatnama & Form Sales Report
  4. Income & Expense Audit Statement
  5. Welfare Claims & Disbursements Report
  6. Voluntary Donations Report
- **Export Capabilities:** One-click download in Microsoft Excel (`.xlsx`) or Comma Separated (`.csv`) via `xlsx`.
- Clean print-friendly views with customized print stylesheets.

---

### 14. Master Settings & System Administration
- Association identity configuration (Name, Charter No, Address, Phone, Email, Currency Symbol).
- Default fee schedules & active financial cycle.
- User management: create users, assign roles, reset passwords, and toggle active/inactive states.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Framework** | Next.js 15+ (App Router) |
| **Language** | TypeScript (Strict mode) |
| **Styling** | Tailwind CSS (Navy Blue `#0B192C`, Slate `#1E3E62`, Gold `#D4AF37`) |
| **Database** | MySQL 8.0+ / MariaDB 10.4+ |
| **DB Driver** | `mysql2/promise` with connection pooling |
| **Auth** | `bcryptjs` + `jose` (Edge-compatible JWT) in HttpOnly cookies |
| **Data Viz** | Recharts |
| **Icons** | Lucide React |
| **Excel Export** | `xlsx` (SheetJS) |

---

## 🚀 Installation & Setup Instructions

### 1. Prerequisites
- Node.js 18.0.0 or higher
- MySQL Server (running on port 3306, e.g. via XAMPP, standalone MySQL, or Docker)

### 2. Clone & Install Dependencies
```bash
git clone <repository_url>
cd bar-council
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bar-council

JWT_SECRET=bar-council-secure-secret-token-key-2026-production
NEXT_PUBLIC_APP_NAME="Bar Association Management System"
```

### 4. Initialize Database Schema & Seed Data
Initialize all 32 tables, foreign keys, and indexes:
```bash
# Run schema migration and seed initial production data:
npm run db:init
npm run db:seed
```

Alternatively, you can import `scripts/database.sql` directly into MySQL:
```bash
mysql -u root -p bar-council < scripts/database.sql
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build & Run for Production
```bash
npm run build
npm start
```

---

## 🔐 Default Demo Accounts

The database seed script populates the following accounts for immediate testing:

| Role | Email | Password | Privileges |
|---|---|---|---|
| **Super Admin** | `admin@districtbar.org.in` | `Admin@12345` | Full System Access & Master Settings |
| **Secretary** | `secretary@districtbar.org.in` | `Secretary@123` | Advocates, Sales, Claims Review |
| **Accounts** | `accounts@districtbar.org.in` | `Accounts@123` | Collections, Dues, Expenses, Disbursements |
| **Office Staff** | `staff@districtbar.org.in` | `Staff@123` | Data Entry, Sales, Claims Intake |
| **Committee** | `committee@districtbar.org.in` | `Committee@123` | Read-only Dashboard & Reports |

---

## 💾 Database Backup & Restore

### Backup
```bash
mysqldump -u root -p bar-council > backup_bar_council_$(date +%Y%m%d).sql
```

### Restore
```bash
mysql -u root -p bar-council < backup_bar_council_YYYYMMDD.sql
```

---

## 📄 License
Commercial proprietary software developed for Bar Association & Bar Council Administration.
