import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleValues = [
  "ADMIN",
  "DATA_ENTRY_OPERATOR",
  "PAYMENT_OFFICER",
  "LICENSE_OFFICER",
  "EXAMINER",
] as const;
export type Role = (typeof roleValues)[number];
export const roleEnum = pgEnum("role", roleValues);
export const genderValues = ["MALE", "FEMALE", "OTHER"] as const;
export type Gender = (typeof genderValues)[number];
export const genderEnum = pgEnum("gender", genderValues);
export const photoStatusEnum = pgEnum("photo_status", ["ACTIVE", "SUPERSEDED"]);

const id = () => uuid("id").defaultRandom().primaryKey();
const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

function masterColumns() {
  return {
    id: id(),
    code: text("code").notNull().unique(),
    name: text("name").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isProtected: boolean("is_protected").default(false).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  };
}

export const nationalities = pgTable("nationalities", masterColumns());
export const bloodGroups = pgTable("blood_groups", masterColumns());
export const applicationTypes = pgTable("application_types", masterColumns());
export const applicationStatuses = pgTable("application_statuses", masterColumns());
export const paymentTypes = pgTable("payment_types", masterColumns());
export const provinces = pgTable("provinces", masterColumns());
export const licenseCategories = pgTable("license_categories", masterColumns());

export const branches = pgTable("branches", {
  ...masterColumns(),
  provinceId: uuid("province_id")
    .notNull()
    .references(() => provinces.id, { onDelete: "restrict" }),
  address: text("address").notNull(),
});

export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull(),
    branchId: uuid("branch_id").references(() => branches.id, { onDelete: "restrict" }),
    isActive: boolean("is_active").default(true).notNull(),
    authVersion: integer("auth_version").default(1).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`)],
);

export const applicants = pgTable(
  "applicants",
  {
    id: id(),
    cnic: text("cnic").notNull().unique(),
    legalName: text("legal_name").notNull(),
    fatherSpouseName: text("father_spouse_name").notNull(),
    dateOfBirth: date("date_of_birth").notNull(),
    gender: genderEnum("gender").notNull(),
    nationalityId: uuid("nationality_id").notNull().references(() => nationalities.id, { onDelete: "restrict" }),
    bloodGroupId: uuid("blood_group_id").notNull().references(() => bloodGroups.id, { onDelete: "restrict" }),
    phone: text("phone").notNull(),
    email: text("email"),
    address: text("address").notNull(),
    provinceId: uuid("province_id").notNull().references(() => provinces.id, { onDelete: "restrict" }),
    homeBranchId: uuid("home_branch_id").notNull().references(() => branches.id, { onDelete: "restrict" }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    updatedById: uuid("updated_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    check("applicants_cnic_format", sql`${table.cnic} ~ '^[0-9]{13}$'`),
    check("applicants_phone_format", sql`${table.phone} ~ '^\\+923[0-9]{9}$'`),
  ],
);

export const applicantPhotos = pgTable(
  "applicant_photos",
  {
    id: id(),
    applicantId: uuid("applicant_id").notNull().references(() => applicants.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull().unique(),
    bucket: text("bucket").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    etag: text("etag"),
    version: integer("version").notNull(),
    status: photoStatusEnum("status").default("ACTIVE").notNull(),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    supersededAt: timestamp("superseded_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [uniqueIndex("applicant_photo_version_unique").on(table.applicantId, table.version)],
);

export const policies = pgTable(
  "policies",
  {
    id: id(),
    permanentEligibilityDays: integer("permanent_eligibility_days").notNull(),
    learnerValidityMonths: integer("learner_validity_months").notNull(),
    permanentValidityMonths: integer("permanent_validity_months").notNull(),
    internationalValidityMonths: integer("international_validity_months").notNull(),
    computerPassPercentage: integer("computer_pass_percentage").notNull(),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("policies_effective_from_unique").on(table.effectiveFrom)],
);

export const feeSchedules = pgTable(
  "fee_schedules",
  {
    id: id(),
    applicationTypeId: uuid("application_type_id")
      .notNull()
      .references(() => applicationTypes.id, { onDelete: "restrict" }),
    licenseCategoryId: uuid("license_category_id")
      .notNull()
      .references(() => licenseCategories.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    currency: text("currency").default("PKR").notNull(),
    effectiveFrom: date("effective_from").notNull(),
    effectiveTo: date("effective_to"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("fee_schedule_effective_unique").on(
      table.applicationTypeId,
      table.licenseCategoryId,
      table.effectiveFrom,
    ),
  ],
);

export const auditLogs = pgTable("audit_logs", {
  id: id(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  branchId: uuid("branch_id").references(() => branches.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: createdAt(),
});

export type UserRecord = typeof users.$inferSelect;
export type AuditInsert = typeof auditLogs.$inferInsert;
