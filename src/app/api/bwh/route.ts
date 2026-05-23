import { NextResponse } from "next/server";
import * as kiwivm from "@/lib/kiwivm";
import { db } from "@/lib/db";
import { serverStatus } from "@/db/schema";
import { getLiveServiceInfo, getRawUsageStats } from "@/lib/kiwivm";

// Store status data with debounce to avoid duplicates when dashboard calls both endpoints
let lastStoreTime = 0;
const STORE_DEBOUNCE_MS = 10_000;

async function storeStatusIfRecent() {
  const now = Date.now();
  if (now - lastStoreTime < STORE_DEBOUNCE_MS) return;
  lastStoreTime = now;

  try {
    const liveData = await getLiveServiceInfo();
    const usageData = await getRawUsageStats().catch(() => null);

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
      dataCounter: usageData ? Number(usageData.data_counter || 0) : null,
    });
  } catch {
    // silently ignore storage failures to not break the API response
  }
}

const actions: Record<string, (params: Record<string, string>) => Promise<unknown>> = {
  start: () => kiwivm.startVps(),
  stop: () => kiwivm.stopVps(),
  restart: () => kiwivm.restartVps(),
  kill: () => kiwivm.killVps(),
  getServiceInfo: () => kiwivm.getServiceInfo(),
  getLiveServiceInfo: () => kiwivm.getLiveServiceInfo(),
  getAvailableOS: () => kiwivm.getAvailableOS(),
  reinstallOS: (p) => kiwivm.reinstallOS(p.os),
  getSshKeys: () => kiwivm.getSshKeys(),
  updateSshKeys: (p) => kiwivm.updateSshKeys(p.ssh_keys),
  resetRootPassword: () => kiwivm.resetRootPassword(),
  getRawUsageStats: () => kiwivm.getRawUsageStats(),
  getAuditLog: () => kiwivm.getAuditLog(),
  setHostname: (p) => kiwivm.setHostname(p.hostname),
  setPTR: (p) => kiwivm.setPTR(p.ip, p.ptr),
  mountISO: (p) => kiwivm.mountISO(p.iso),
  unmountISO: () => kiwivm.unmountISO(),
  execCommand: (p) => kiwivm.execCommand(p.command),
  execScript: (p) => kiwivm.execScript(p.script),
  shellCd: (p) => kiwivm.shellCd(p.currentDir, p.newDir),
  createSnapshot: (p) => kiwivm.createSnapshot(p.description),
  listSnapshots: () => kiwivm.listSnapshots(),
  deleteSnapshot: (p) => kiwivm.deleteSnapshot(p.snapshot),
  restoreSnapshot: (p) => kiwivm.restoreSnapshot(p.snapshot),
  toggleSticky: (p) => kiwivm.toggleSticky(p.snapshot, Number(p.sticky)),
  exportSnapshot: (p) => kiwivm.exportSnapshot(p.snapshot),
  importSnapshot: (p) => kiwivm.importSnapshot(p.sourceVeid, p.sourceToken),
  listBackups: () => kiwivm.listBackups(),
  backupCopyToSnapshot: (p) => kiwivm.backupCopyToSnapshot(p.backupToken),
  addIpv6: () => kiwivm.addIpv6(),
  deleteIpv6: (p) => kiwivm.deleteIpv6(p.ip),
  getAvailablePrivateIps: () => kiwivm.getAvailablePrivateIps(),
  assignPrivateIp: (p) => kiwivm.assignPrivateIp(p.ip || undefined),
  deletePrivateIp: (p) => kiwivm.deletePrivateIp(p.ip),
  getMigrationLocations: () => kiwivm.getMigrationLocations(),
  startMigration: (p) => kiwivm.startMigration(p.location),
  getNotificationPreferences: () => kiwivm.getNotificationPreferences(),
  setNotificationPreferences: (p) => kiwivm.setNotificationPreferences(p.json_notification_preferences),
  getRateLimitStatus: () => kiwivm.getRateLimitStatus(),
  getSuspensionDetails: () => kiwivm.getSuspensionDetails(),
  unsuspend: (p) => kiwivm.unsuspend(p.record_id),
  getPolicyViolations: () => kiwivm.getPolicyViolations(),
  resolvePolicyViolation: (p) => kiwivm.resolvePolicyViolation(p.record_id),
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    if (!action || !actions[action]) {
      return NextResponse.json({ error: 1, message: `Unknown action: ${action}` }, { status: 400 });
    }

    const result = await actions[action](params);

    // Store status on getLiveServiceInfo / getRawUsageStats calls (debounced)
    if (action === "getLiveServiceInfo" || action === "getRawUsageStats") {
      storeStatusIfRecent();
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: 1, message }, { status: 500 });
  }
}
