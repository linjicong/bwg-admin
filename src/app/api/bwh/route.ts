import { NextResponse } from "next/server";
import * as kiwivm from "@/lib/kiwivm";

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
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: 1, message }, { status: 500 });
  }
}
