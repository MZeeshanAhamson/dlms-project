import type { Role } from "./schema";

export const MASTER_SEEDS = {
  nationalities: [
    ["PK", "Pakistani"],
    ["AF", "Afghan"],
    ["CN", "Chinese"],
    ["GB", "British"],
    ["US", "American"],
  ],
  bloodGroups: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
    (value) => [value, value] as const,
  ),
  provinces: [
    ["PB", "Punjab"],
    ["SD", "Sindh"],
    ["KP", "Khyber Pakhtunkhwa"],
    ["BA", "Balochistan"],
    ["ICT", "Islamabad Capital Territory"],
    ["GB", "Gilgit-Baltistan"],
    ["AJK", "Azad Jammu & Kashmir"],
  ],
  paymentTypes: [
    ["CASH", "Cash"],
    ["CARD", "Card"],
    ["BANK_CHALLAN", "Bank Challan"],
    ["ONLINE", "Online"],
  ],
  applicationTypes: [
    ["LEARNER", "Learner"],
    ["PERMANENT", "Permanent"],
    ["INTERNATIONAL", "International"],
    ["PERMANENT_RENEWAL", "Permanent Renewal"],
    ["INTERNATIONAL_RENEWAL", "International Renewal"],
  ],
  applicationStatuses: [
    ["DATA_ENTRY", "Data Entry"],
    ["FEES_SUBMISSION", "Fees Submission"],
    ["MEDICAL", "Medical"],
    ["COMPUTER", "Computer"],
    ["DRIVING", "Driving"],
    ["DOCUMENTS", "Documents"],
    ["LICENSE_ISSUANCE", "License Issuance"],
    ["ISSUED", "Issued"],
    ["CANCELLED", "Cancelled"],
  ],
  licenseCategories: [
    ["MOTORCYCLE", "Motorcycle"],
    ["MOTORCAR_JEEP", "Motorcar / Jeep"],
    ["LTV", "LTV"],
    ["HTV", "HTV"],
    ["TRACTOR", "Tractor"],
    ["PSV", "PSV"],
  ],
} as const;

export const BRANCH_SEEDS = [
  { code: "LHR-CENTRAL", name: "Lahore Central", provinceCode: "PB", address: "Lahore, Punjab" },
  { code: "RWP", name: "Rawalpindi", provinceCode: "PB", address: "Rawalpindi, Punjab" },
  { code: "MUX", name: "Multan", provinceCode: "PB", address: "Multan, Punjab" },
] as const;

export const DEMO_USERS: ReadonlyArray<{ email: string; name: string; role: Role; branchCode: string | null }> = [
  { email: "admin@dlms.test", name: "Demo Administrator", role: "ADMIN", branchCode: null },
  { email: "data.entry@dlms.test", name: "Demo Data Entry Operator", role: "DATA_ENTRY_OPERATOR", branchCode: "LHR-CENTRAL" },
  { email: "payment.officer@dlms.test", name: "Demo Payment Officer", role: "PAYMENT_OFFICER", branchCode: "LHR-CENTRAL" },
  { email: "license.officer@dlms.test", name: "Demo License Officer", role: "LICENSE_OFFICER", branchCode: "LHR-CENTRAL" },
  { email: "examiner@dlms.test", name: "Demo Examiner", role: "EXAMINER", branchCode: "LHR-CENTRAL" },
];

export const DEMO_POLICY = {
  permanentEligibilityDays: 42,
  learnerValidityMonths: 6,
  permanentValidityMonths: 60,
  internationalValidityMonths: 12,
  computerPassPercentage: 80,
  effectiveFrom: "2026-01-01",
} as const;

export const FEE_BASES: Record<string, number> = {
  LEARNER: 500,
  PERMANENT: 2000,
  INTERNATIONAL: 5000,
  PERMANENT_RENEWAL: 1500,
  INTERNATIONAL_RENEWAL: 4000,
};

export const CATEGORY_ADDITIONS: Record<string, number> = {
  MOTORCYCLE: 0,
  MOTORCAR_JEEP: 200,
  LTV: 500,
  HTV: 1000,
  TRACTOR: 300,
  PSV: 800,
};
