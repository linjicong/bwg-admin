"use client";

import { useEffect, useState } from "react";
import { Card, Progress, Descriptions, Button, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { bwhApi } from "@/lib/api";

interface UsageData {
  plan_monthly_data: number;
  data_counter: number;
  monthly_data_multiplier: number;
  data_next_reset: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function UsageStats() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await bwhApi<UsageData>("getServiceInfo");
      setData(result);
    } catch (err) {
      message.error("获取使用量失败: " + (err instanceof Error ? err.message : "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (!data) return <Card loading={loading} title="使用量统计" />;

  const totalBytes = data.plan_monthly_data * (data.monthly_data_multiplier || 1);
  const usedBytes = data.data_counter * (data.monthly_data_multiplier || 1);
  const percent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;
  const resetDate = data.data_next_reset
    ? new Date(data.data_next_reset * 1000).toLocaleDateString("zh-CN")
    : "未知";

  return (
    <Card
      title="使用量统计"
      extra={<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} size="small">刷新</Button>}
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label="带宽使用">
          <Progress percent={percent} status={percent > 90 ? "exception" : "active"} />
          <div style={{ marginTop: 4, fontSize: 12, color: "#888" }}>
            {formatBytes(usedBytes)} / {formatBytes(totalBytes)}
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="下次重置">{resetDate}</Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
