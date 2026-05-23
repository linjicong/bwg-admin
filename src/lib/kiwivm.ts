const API_BASE = "https://api.64clouds.com/v1";

interface BwhResponse {
  error: number;
  message?: string;
  [key: string]: unknown;
}

async function callApi(action: string, params: Record<string, string> = {}): Promise<BwhResponse> {
  const veid = process.env.BWH_VEID;
  const apiKey = process.env.BWH_API_KEY;

  if (!veid || !apiKey) {
    throw new Error("BWH_VEID and BWH_API_KEY must be set");
  }

  const body = new URLSearchParams({
    veid,
    api_key: apiKey,
    ...params,
  });

  const res = await fetch(`${API_BASE}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`KiwiVM API error: ${res.status} ${res.statusText}`);
  }

  const data: BwhResponse = await res.json();
  if (data.error !== 0) {
    throw new Error(data.message || `API call ${action} failed`);
  }

  return data;
}

// Server lifecycle
export const startVps = () => callApi("start");
export const stopVps = () => callApi("stop");
export const restartVps = () => callApi("restart");
export const killVps = () => callApi("kill");

// Service info
export const getServiceInfo = () => callApi("getServiceInfo");
export const getLiveServiceInfo = () => callApi("getLiveServiceInfo");

// OS
export const getAvailableOS = () => callApi("getAvailableOS");
export const reinstallOS = (os: string) => callApi("reinstallOS", { os });

// SSH Keys
export const getSshKeys = () => callApi("getSshKeys");
export const updateSshKeys = (sshKeys: string) => callApi("updateSshKeys", { ssh_keys: sshKeys });

// Password
export const resetRootPassword = () => callApi("resetRootPassword");

// Stats
export const getRawUsageStats = () => callApi("getRawUsageStats");
export const getAuditLog = () => callApi("getAuditLog");

// Hostname & PTR
export const setHostname = (hostname: string) => callApi("setHostname", { newHostname: hostname });
export const setPTR = (ip: string, ptr: string) => callApi("setPTR", { ip, ptr });

// ISO
export const mountISO = (iso: string) => callApi("iso/mount", { iso });
export const unmountISO = () => callApi("iso/unmount");

// Shell
export const execCommand = (command: string) => callApi("basicShell/exec", { command });
export const execScript = (script: string) => callApi("shellScript/exec", { script });
export const shellCd = (currentDir: string, newDir: string) =>
  callApi("basicShell/cd", { currentDir, newDir });

// Snapshots
export const createSnapshot = (description?: string) =>
  callApi("snapshot/create", description ? { description } : {});
export const listSnapshots = () => callApi("snapshot/list");
export const deleteSnapshot = (snapshot: string) => callApi("snapshot/delete", { snapshot });
export const restoreSnapshot = (snapshot: string) => callApi("snapshot/restore", { snapshot });
export const toggleSticky = (snapshot: string, sticky: number) =>
  callApi("snapshot/toggleSticky", { snapshot, sticky: String(sticky) });
export const exportSnapshot = (snapshot: string) => callApi("snapshot/export", { snapshot });
export const importSnapshot = (sourceVeid: string, sourceToken: string) =>
  callApi("snapshot/import", { sourceVeid, sourceToken });

// Backups
export const listBackups = () => callApi("backup/list");
export const backupCopyToSnapshot = (backupToken: string) =>
  callApi("backup/copyToSnapshot", { backupToken });

// IPv6
export const addIpv6 = () => callApi("ipv6/add");
export const deleteIpv6 = (ip: string) => callApi("ipv6/delete", { ip });

// Private IP
export const getAvailablePrivateIps = () => callApi("privateIp/getAvailableIps");
export const assignPrivateIp = (ip?: string) =>
  callApi("privateIp/assign", ip ? { ip } : {});
export const deletePrivateIp = (ip: string) => callApi("privateIp/delete", { ip });

// Migration
export const getMigrationLocations = () => callApi("migrate/getLocations");
export const startMigration = (location: string) => callApi("migrate/start", { location });

// Notification preferences
export const getNotificationPreferences = () => callApi("kiwivm/getNotificationPreferences");
export const setNotificationPreferences = (prefs: string) =>
  callApi("kiwivm/setNotificationPreferences", { json_notification_preferences: prefs });

// Rate limit
export const getRateLimitStatus = () => callApi("getRateLimitStatus");

// Suspension & Policy
export const getSuspensionDetails = () => callApi("getSuspensionDetails");
export const unsuspend = (recordId: string) => callApi("unsuspend", { record_id: recordId });
export const getPolicyViolations = () => callApi("getPolicyViolations");
export const resolvePolicyViolation = (recordId: string) =>
  callApi("resolvePolicyViolation", { record_id: recordId });
