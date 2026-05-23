import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../db/schema";

const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  port: parseInt(process.env.TIDB_PORT || "4000"),
  ssl: { rejectUnauthorized: true },
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

export const db = drizzle({ client: pool, schema, mode: "default" });
