export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN_SECRETARY: "admin_secretary",
  ACCOUNTS_FINANCE: "accounts_finance",
  DATA_ENTRY: "data_entry",
  READONLY_COMMITTEE: "readonly_committee",
} as const;

export type RoleSlug = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin_secretary: "Administrator / Secretary",
  accounts_finance: "Accounts / Finance",
  data_entry: "Data Entry / Office Staff",
  readonly_committee: "Read-only / Committee User",
};

export const ADVOCATE_STATUSES = ["active", "inactive", "suspended", "deceased"] as const;

export const DUE_TYPES = [
  { value: "monthly_chanda", label: "Monthly Chanda" },
  { value: "annual_dues", label: "Annual Dues" },
  { value: "admission_fee", label: "Admission Fee" },
  { value: "other", label: "Other" },
] as const;

export const CLAIM_WORKFLOW_STATUSES = [
  { value: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "under_review", label: "Under Review", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  { value: "documents_pending", label: "Documents Pending", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  { value: "approved", label: "Approved", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { value: "rejected", label: "Rejected", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
  { value: "disbursed", label: "Disbursed", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
] as const;

export const DOCUMENT_VERIFICATION_STATUSES = [
  { value: "not_submitted", label: "Not Submitted" },
  { value: "received", label: "Received" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "reupload_required", label: "Re-upload Required" },
] as const;

export const MONTHS = [
  { value: 1, name: "January" },
  { value: 2, name: "February" },
  { value: 3, name: "March" },
  { value: 4, name: "April" },
  { value: 5, name: "May" },
  { value: 6, name: "June" },
  { value: 7, name: "July" },
  { value: 8, name: "August" },
  { value: 9, name: "September" },
  { value: 10, name: "October" },
  { value: 11, name: "November" },
  { value: 12, name: "December" },
];
