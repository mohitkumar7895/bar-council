// Dynamic in-memory store for cloud/serverless environment when MySQL is offline.
// Starts with 0 advocates/transactions so whatever the user adds is immediately visible!

export interface InMemoryStore {
  advocates: any[];
  membershipDues: any[];
  payments: any[];
  waqalatnamaItems: any[];
  waqalatnamaSales: any[];
  formTypes: any[];
  formSales: any[];
  donations: any[];
  deathClaims: any[];
  healthClaims: any[];
  cases: any[];
  incomeEntries: any[];
  expenseEntries: any[];
  documents: any[];
  settings: Record<string, string>;
}

declare global {
  // eslint-disable-next-line no-var
  var __inMemoryStore: InMemoryStore | undefined;
}

export function getStore(): InMemoryStore {
  if (!global.__inMemoryStore) {
    global.__inMemoryStore = {
      advocates: [], // Starts at 0!
      membershipDues: [], // Starts at 0!
      payments: [], // Starts at 0!
      waqalatnamaItems: [
        {
          id: 1,
          item_code: "WQT-STD",
          item_name: "Standard Waqalatnama (Single Sheet)",
          description: "Official Bar Council authorized single sheet Waqalatnama",
          unit_rate: 50.0,
          current_stock: 5000,
          low_stock_threshold: 100,
          total_sold: 0,
          is_active: 1,
        },
        {
          id: 2,
          item_code: "WQT-BOOK",
          item_name: "Waqalatnama Booklet (50 Leaves)",
          description: "Official booklet containing 50 serial numbered Waqalatnama",
          unit_rate: 2200.0,
          current_stock: 500,
          low_stock_threshold: 50,
          total_sold: 0,
          is_active: 1,
        },
        {
          id: 3,
          item_code: "WQT-AFF",
          item_name: "Affidavit Stamp Form",
          description: "Prescribed Bar Association affidavit format",
          unit_rate: 20.0,
          current_stock: 2000,
          low_stock_threshold: 100,
          total_sold: 0,
          is_active: 1,
        },
      ],
      waqalatnamaSales: [], // Starts at 0!
      formTypes: [
        {
          id: 1,
          form_code: "FORM-MEMB",
          form_name: "Advocate Membership Application Form",
          description: "Standard Bar Association enrolment and membership form",
          sale_price: 50.0,
          current_stock: 1000,
          low_stock_threshold: 50,
          total_sold: 0,
        },
        {
          id: 2,
          form_code: "FORM-CHAMBER",
          form_name: "Chamber Allotment Requisition Form",
          description: "Requisition form for chamber/table space in bar complex",
          sale_price: 100.0,
          current_stock: 500,
          low_stock_threshold: 25,
          total_sold: 0,
        },
        {
          id: 3,
          form_code: "FORM-NOC",
          form_name: "Transfer / No Objection Certificate Form",
          description: "NOC requisition for transfer to other bar councils",
          sale_price: 150.0,
          current_stock: 500,
          low_stock_threshold: 25,
          total_sold: 0,
        },
      ],
      formSales: [], // Starts at 0!
      donations: [], // Starts at 0!
      deathClaims: [], // Starts at 0!
      healthClaims: [], // Starts at 0!
      cases: [], // Starts at 0!
      incomeEntries: [], // Starts at 0!
      expenseEntries: [], // Starts at 0!
      documents: [], // Starts at 0!
      settings: {
        association_name: "Jila Bar Association District Bahraich",
        court_complex: "District & Sessions Court Compound, Bahraich",
        registration_no: "REG/DBA/BAHRAICH/1972",
        financial_year: "2025-2026",
        membership_cycle: "Jan-Dec",
        annual_dues_amount: "2400",
        waqalatnama_unit_price: "50",
      },
    };
  }
  return global.__inMemoryStore;
}
