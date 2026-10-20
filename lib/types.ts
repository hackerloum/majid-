export type Lang = "sw" | "en";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type GroupLaw = {
  id: string;
  body: string;
  created_at: string;
};

export type Member = {
  id: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
};

export type MemberOption = {
  id: string;
  full_name: string;
  is_active: boolean;
};

export type ContributionRow = {
  id: string;
  amount: number | string;
  paid_on: string;
  note: string | null;
  member_name: string;
};

export type LoanRow = {
  id: string;
  member_id: string;
  member_name: string;
  principal: number | string;
  interest_percent: number | string;
  interest_amount: number | string;
  total_due: number | string;
  issued_on: string;
  status: "active" | "paid";
  repayments: RepaymentRow[];
};

export type RepaymentRow = {
  id: string;
  amount: number | string;
  paid_on: string;
  note: string | null;
};

export type FineRow = {
  id: string;
  amount: number | string;
  reason: string;
  fined_on: string;
  member_name: string;
};

export type TransactionRow = {
  id: string;
  kind: "contribution" | "loan_out" | "repayment" | "fine" | "shareout";
  amount: number | string;
  occurred_on: string;
  note: string | null;
};

export type ActivityRow = {
  id: string;
  action: string;
  summary: string;
  created_at: string;
};

export type UnpaidMember = {
  id: string;
  full_name: string;
};

export type Snapshot = {
  members_active: number;
  members_all: number;
  contributions_total: number;
  fines_total: number;
  loans_principal: number;
  loans_interest: number;
  repayments_total: number;
  outstanding: number;
  interest_collected: number;
  unpaid: UnpaidMember[];
};

export type ShareLine = {
  member_id: string;
  full_name: string;
  contribution: number;
  profit_share: number;
  payout: number;
};

export type SharePreview = {
  interest_collected: number;
  fines_total: number;
  profit: number;
  contributions_total: number;
  outstanding_loans: number;
  lines: ShareLine[];
};
