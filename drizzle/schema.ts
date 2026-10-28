import {
  pgTable,
  pgEnum,
  text,
  varchar,
  uuid,
  timestamp,
  integer,
  foreignKey,
} from "drizzle-orm/pg-core";

// ── Enums ────────────────────────────────────────────────────────────────────

export const appRoleEnum = pgEnum("app_role", [
  "super_admin",
  "institution_admin",
  "coordinator",
  "student",
  "industry_supervisor",
  "institution_supervisor",
  "org_admin",
]);

export const instStatusEnum = pgEnum("inst_status", [
  "pending",
  "approved",
  "suspended",
]);

export const logStatusEnum = pgEnum("log_status", [
  "submitted",
  "approved",
  "needs_correction",
]);

export const placementStatusEnum = pgEnum("placement_status", [
  "pending",
  "approved",
  "rejected",
]);

// ── Tables ───────────────────────────────────────────────────────────────────

export const institutions = pgTable("institutions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  state: text("state").notNull().default(""),
  type: text("type").notNull().default("university"),
  status: instStatusEnum("status").notNull().default("pending"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  created_by: uuid("created_by"),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // references auth.users(id)
  full_name: text("full_name").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  department: text("department").notNull().default(""),
  level: text("level").notNull().default(""),
  matric_no: text("matric_no").notNull().default(""),
  institution_id: uuid("institution_id").references(() => institutions.id, { onDelete: "set null" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull(),
  role: appRoleEnum("role").notNull(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  state: text("state").notNull().default(""),
  sector: text("sector").notNull().default(""),
  slots: integer("slots").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  created_by: uuid("created_by"),
});

export const placements = pgTable("placements", {
  id: uuid("id").primaryKey().defaultRandom(),
  student_id: uuid("student_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  institution_id: uuid("institution_id")
    .notNull()
    .references(() => institutions.id),
  organization_id: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  industry_supervisor_id: uuid("industry_supervisor_id").references(() => profiles.id),
  role_title: text("role_title").notNull().default(""),
  start_date: text("start_date").notNull(),
  end_date: text("end_date").notNull(),
  status: placementStatusEnum("status").notNull().default("pending"),
  reviewer_note: text("reviewer_note").notNull().default(""),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const logbookEntries = pgTable("logbook_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  placement_id: uuid("placement_id")
    .notNull()
    .references(() => placements.id, { onDelete: "cascade" }),
  student_id: uuid("student_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  entry_date: text("entry_date").notNull().default(""),
  week_number: integer("week_number").notNull().default(1),
  activities: text("activities").notNull(),
  skills: text("skills").notNull().default(""),
  status: logStatusEnum("status").notNull().default("submitted"),
  supervisor_comment: text("supervisor_comment").notNull().default(""),
  reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
