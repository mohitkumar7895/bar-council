export interface User {
  id: number;
  role_id: number;
  role_slug?: string;
  role_name?: string;
  name: string;
  email: string;
  password_hash?: string;
  phone?: string;
  status: "active" | "inactive" | "suspended";
  avatar_url?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Advocate {
  id: number;
  advocate_code: string;
  full_name: string;
  photo_url?: string;
  father_name: string;
  address?: string;
  phone: string;
  email?: string;
  bar_council_reg_no: string;
  association_membership_no: string;
  kalyan_nidhi_no?: string;
  apda_kosh_details?: string;
  membership_start_date: string;
  renewal_date?: string;
  membership_status: "active" | "inactive" | "suspended" | "deceased";
  admission_fee: number;
  monthly_chanda: number;
  annual_dues: number;
  remarks?: string;
  created_at: string;
  updated_at: string;
  // Computed / aggregated fields
  total_paid?: number;
  total_due?: number;
  outstanding_amount?: number;
}

export interface MembershipPeriod {
  id: number;
  period_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  annual_dues_rate: number;
  monthly_chanda_rate: number;
  created_at: string;
}

export interface MembershipDue {
  id: number;
  advocate_id: number;
  period_id: number;
  due_type: "monthly_chanda" | "annual_dues" | "admission_fee" | "other";
  due_month?: number;
  due_year: number;
  amount: number;
  paid_amount: number;
  status: "unpaid" | "partial" | "paid" | "waived";
  due_date?: string;
  created_at: string;
  updated_at: string;
  // Joins
  advocate_name?: string;
  advocate_code?: string;
  period_name?: string;
}

export interface Payment {
  id: number;
  receipt_no: string;
  advocate_id?: number;
  payment_date: string;
  amount: number;
  payment_mode: string;
  reference_number?: string;
  source_module: "membership" | "waqalatnama" | "form_sale" | "donation" | "other_income";
  source_id?: number;
  received_by_user_id?: number;
  payer_name?: string;
  status: "completed" | "cancelled";
  notes?: string;
  created_at: string;
  // Joins
  advocate_name?: string;
  advocate_code?: string;
  received_by_name?: string;
}

export interface WaqalatnamaItem {
  id: number;
  item_code: string;
  item_name: string;
  description?: string;
  unit_rate: number;
  current_stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WaqalatnamaSale {
  id: number;
  sale_no: string;
  sale_date: string;
  advocate_id?: number;
  customer_name: string;
  total_amount: number;
  discount: number;
  net_amount: number;
  amount_received: number;
  balance_amount: number;
  payment_mode: string;
  payment_status: "paid" | "partial" | "pending";
  payment_id?: number;
  remarks?: string;
  user_id?: number;
  created_at: string;
  // Items join
  items?: WaqalatnamaSaleItem[];
  advocate_name?: string;
  advocate_code?: string;
}

export interface WaqalatnamaSaleItem {
  id?: number;
  sale_id?: number;
  item_id: number;
  item_name?: string;
  quantity: number;
  unit_rate: number;
  total_amount: number;
}

export interface FormType {
  id: number;
  form_code: string;
  form_name: string;
  description?: string;
  sale_price: number;
  current_stock: number;
  low_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormSale {
  id: number;
  sale_no: string;
  sale_date: string;
  advocate_id?: number;
  buyer_name: string;
  form_type_id: number;
  quantity: number;
  unit_price: number;
  total_amount: number;
  amount_received: number;
  balance_amount: number;
  payment_mode: string;
  payment_status: "paid" | "partial" | "pending";
  payment_id?: number;
  remarks?: string;
  user_id?: number;
  created_at: string;
  // Joins
  form_name?: string;
  form_code?: string;
  advocate_name?: string;
}

export interface Donation {
  id: number;
  donation_no: string;
  contributor_name: string;
  advocate_id?: number;
  phone?: string;
  email?: string;
  pan_number?: string;
  donation_date: string;
  amount: number;
  category_id?: number;
  donation_purpose: string;
  payment_mode: string;
  reference_number?: string;
  receipt_number?: string;
  status: "received" | "pledged" | "pending";
  payment_id?: number;
  notes?: string;
  user_id?: number;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

export interface DeathBenefitClaim {
  id: number;
  claim_no: string;
  advocate_id: number;
  deceased_advocate_name: string;
  membership_no: string;
  registration_no: string;
  date_of_death: string;
  applicant_name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  requested_amount: number;
  application_date: string;
  assigned_reviewer_id?: number;
  reviewer_remarks?: string;
  claim_status: "submitted" | "under_review" | "documents_pending" | "approved" | "rejected" | "disbursed";
  sanctioned_amount: number;
  approval_date?: string;
  approved_by_user_id?: number;
  disbursement_date?: string;
  payment_mode?: string;
  bank_reference_no?: string;
  disbursement_remarks?: string;
  created_at: string;
  updated_at: string;
  reviewer_name?: string;
  approver_name?: string;
  documents?: ClaimDocument[];
}

export interface HealthClaim {
  id: number;
  claim_no: string;
  advocate_id: number;
  applicant_name: string;
  relationship: "self" | "spouse" | "child" | "parent" | "dependent";
  category_id?: number;
  requested_amount: number;
  submission_date: string;
  hospital_name?: string;
  illness_details?: string;
  admission_date?: string;
  discharge_date?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  verification_status: "pending" | "in_progress" | "verified" | "rejected";
  reviewer_remarks?: string;
  claim_status: "submitted" | "under_review" | "documents_pending" | "approved" | "rejected" | "disbursed";
  sanctioned_amount: number;
  approval_date?: string;
  approved_by_user_id?: number;
  disbursement_date?: string;
  payment_mode?: string;
  bank_reference_no?: string;
  disbursement_remarks?: string;
  created_at: string;
  updated_at: string;
  advocate_name?: string;
  category_name?: string;
  approver_name?: string;
  documents?: ClaimDocument[];
}

export interface ClaimDocument {
  id: number;
  claim_type: "death_benefit" | "health_claim";
  claim_id: number;
  document_type: string;
  document_title: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  verification_status: "not_submitted" | "received" | "verified" | "rejected" | "reupload_required";
  remarks?: string;
  verified_by_user_id?: number;
  verified_at?: string;
  created_at: string;
}

export interface DocumentRecord {
  id: number;
  entity_type: "advocate" | "general" | "case" | "committee";
  entity_id?: number;
  title: string;
  category: string;
  file_path: string;
  original_filename: string;
  file_size: number;
  mime_type?: string;
  verification_status: "received" | "verified" | "rejected";
  remarks?: string;
  uploaded_by_user_id?: number;
  created_at: string;
  uploader_name?: string;
  entity_label?: string;
}

export interface CaseRegister {
  id: number;
  case_no: string;
  reference_number: string;
  category: "disciplinary" | "dispute" | "welfare_appeal" | "arbitration" | "general_grievance";
  applicant_name: string;
  respondent_name?: string;
  advocate_id?: number;
  filing_date: string;
  status: "pending" | "hearing" | "adjourned" | "resolved" | "dismissed";
  presiding_officer?: string;
  notes?: string;
  outcome?: string;
  created_at: string;
  updated_at: string;
  advocate_name?: string;
}

export interface IncomeEntry {
  id: number;
  income_no: string;
  date: string;
  category: "membership_fee" | "monthly_chanda" | "annual_dues" | "waqalatnama_sales" | "form_sales" | "donation" | "other_income";
  description: string;
  amount: number;
  payment_mode: string;
  reference_no?: string;
  received_from?: string;
  is_auto_generated: boolean;
  source_module?: string;
  source_id?: number;
  payment_status: "paid" | "pending" | "partial";
  notes?: string;
  user_id?: number;
  created_at: string;
  user_name?: string;
}

export interface ExpenseEntry {
  id: number;
  expense_no: string;
  date: string;
  category_id: number;
  description: string;
  amount: number;
  payment_mode: string;
  payee_vendor: string;
  reference_number?: string;
  payment_status: "paid" | "pending" | "partial";
  linked_disbursement_id?: number;
  notes?: string;
  user_id?: number;
  created_at: string;
  category_name?: string;
  user_name?: string;
}

export interface FundDisbursement {
  id: number;
  disbursement_no: string;
  disbursement_type: "death_benefit" | "health_claim" | "advocate_relief" | "scholarship" | "other";
  claim_id?: number;
  beneficiary_name: string;
  amount: number;
  disbursement_date: string;
  payment_mode: string;
  bank_reference_no?: string;
  approved_by_user_id?: number;
  notes?: string;
  created_at: string;
  approved_by_name?: string;
}

export interface ActivityLog {
  id: number;
  user_id?: number;
  user_name?: string;
  action: string;
  module: string;
  record_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}
