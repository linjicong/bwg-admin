import { config } from "dotenv";
config({ path: ".env.local" });

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    host: process.env.TIDB_HOST!,
    port: parseInt(process.env.TIDB_PORT || "4000"),
    user: process.env.TIDB_USER!,
    password: process.env.TIDB_PASSWORD!,
    database: process.env.TIDB_DATABASE!,
    ssl: { rejectUnauthorized: true },
  },
});
