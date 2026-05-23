"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Tag, Button, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { bwhApi } from "@/lib/api";

interface LiveInfo {
  ve_status: string;
  ve_used_disk_space_b: number;
  ve_disk_quota_gb: number;
  is_cpu_throttled: number;
  is_disk_throttled: number;
  ssh_port: number;
  live_hostname: string;
  load_average: string;
  mem_available_kb: number;
  swap_total_kb: number;
  swap_available_kb: number;
}

function formatKB(kb: number): string {
  if (kb > 1048576) return (kb / 1048576).toFixed(2) + " GB";
  if (kb > 1024) return (kb / 1024).toFixed(2) + " MB";
  return kb + " KB";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const statusColor: Record<string, string> = {
  Running: "green",
  Stopped: "red",
  Starting: "orange",
};

export default function ServerStatus() {
  const [info, setInfo] = useState<LiveInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bwhApi<LiveInfo>("getLiveServiceInfo");
      setInfo(data);
    } catch (err) {
      message.error("获取实时状态失败: " + (err instanceof Error ? err.message : "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (!info) return <Card loading={loading} title="服务器实时状态" />;

  return (
    <Card
      title="服务器实时状态"
      extra={<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} size="small">刷新</Button>}
    >
      <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
        <Descriptions.Item label="运行状态">
          <Tag color={statusColor[info.ve_status] || "default"}>
            {info.ve_status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="CPU 节流">
          <Tag color={info.is_cpu_throttled ? "red" : "green"}>
            {info.is_cpu_throttled ? "是" : "否"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="磁盘 I/O 节流">
          <Tag color={info.is_disk_throttled ? "red" : "green"}>
            {info.is_disk_throttled ? "是" : "否"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="SSH 端口">{info.ssh_port || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="实时主机名">{info.live_hostname || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="负载">{info.load_average || "N/A"}</Descriptions.Item>
        <Descriptions.Item label="可用内存">{formatKB(info.mem_available_kb || 0)}</Descriptions.Item>
        <Descriptions.Item label="Swap 总量">{formatKB(info.swap_total_kb || 0)}</Descriptions.Item>
        <Descriptions.Item label="磁盘使用">
          {formatBytes(info.ve_used_disk_space_b || 0)} / {info.ve_disk_quota_gb || 0} GB
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
