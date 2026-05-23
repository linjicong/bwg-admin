import { mysqlTable, serial, varchar, text, timestamp, int, bigint, double, boolean } from "drizzle-orm/mysql-core";

export const vpsConfig = mysqlTable("vps_config", {
  id: serial("id").primaryKey(),
  veid: varchar("veid", { length: 50 }).notNull(),
  apiKey: varchar("api_key", { length: 255 }).notNull(),
  hostname: varchar("hostname", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const operationLogs = mysqlTable("operation_logs", {
  id: serial("id").primaryKey(),
  operation: varchar("operation", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // success / failed
  result: text("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serverStatus = mysqlTable("server_status", {
  id: serial("id").primaryKey(),
  veStatus: varchar("ve_status", { length: 20 }),
  cpuUsage: double("cpu_usage"),
  memTotalKb: bigint("mem_total_kb", { mode: "number" }),
  memAvailableKb: bigint("mem_available_kb", { mode: "number" }),
  swapTotalKb: bigint("swap_total_kb", { mode: "number" }),
  swapAvailableKb: bigint("swap_available_kb", { mode: "number" }),
  diskUsedB: bigint("disk_used_b", { mode: "number" }),
  diskQuotaGb: double("disk_quota_gb"),
  loadAverage: varchar("load_average", { length: 50 }),
  isCpuThrottled: boolean("is_cpu_throttled"),
  isDiskThrottled: boolean("is_disk_throttled"),
  dataCounter: bigint("data_counter", { mode: "number" }),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});
