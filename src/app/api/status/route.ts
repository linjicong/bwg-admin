import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serverStatus } from "@/db/schema";
import { gte } from "drizzle-orm";

const rangeMap: Record<string, number> = {
  "1h": 1,
  "6h": 6,
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "24h";
    const hours = rangeMap[range] || 24;

    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const records = await db
      .select()
      .from(serverStatus)
      .where(gte(serverStatus.recordedAt, since))
      .orderBy(serverStatus.recordedAt);

    return NextResponse.json({ error: 0, data: records });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: 1, message }, { status: 500 });
  }
}
