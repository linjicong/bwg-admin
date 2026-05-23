import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serverStatus } from "@/db/schema";
import { getLiveServiceInfo, getRawUsageStats } from "@/lib/kiwivm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 1, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const [liveData, usageData] = await Promise.all([
      getLiveServiceInfo(),
      getRawUsageStats(),
    ]);

    const totalKb = Number(liveData.plan_ram || 0) / 1024;
    const memAvailableKb = Number(liveData.mem_available_kb || 0);
    const cpuUsage = totalKb > 0 ? Math.round((1 - memAvailableKb / totalKb) * 10000) / 100 : null;

    await db.insert(serverStatus).values({
      veStatus: String(liveData.ve_status || ""),
      cpuUsage,
      memTotalKb: totalKb,
      memAvailableKb,
      swapTotalKb: Number(liveData.swap_total_kb || 0),
      swapAvailableKb: Number(liveData.swap_available_kb || 0),
      diskUsedB: Number(liveData.ve_used_disk_space_b || 0),
      diskQuotaGb: Number(liveData.ve_disk_quota_gb || 0),
      loadAverage: String(liveData.load_average || ""),
      isCpuThrottled: Boolean(liveData.is_cpu_throttled),
      isDiskThrottled: Boolean(liveData.is_disk_throttled),
      dataCounter: Number(usageData.data_counter || 0),
    });

    return NextResponse.json({ error: 0, message: "collected" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Collection failed";
    return NextResponse.json({ error: 1, message }, { status: 500 });
  }
}
