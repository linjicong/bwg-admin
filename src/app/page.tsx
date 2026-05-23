"use client";

import { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Progress, Tag, Descriptions, Spin, Alert, Typography, Space } from "antd";
import {
  CloudServerOutlined,
  HddOutlined,
  DashboardOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  SwapOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { bwhApi } from "@/lib/api";

interface ServiceInfo {
  hostname: string;
  node_alias: string;
  node_location: string;
  plan: string;
  os: string;
  email: string;
  ip_addresses: string[] | Record<string, string>;
  vm_type: string;
  suspended: boolean;
  plan_ram: number;
  plan_swap: number;
  plan_disk: number;
  plan_monthly_data: number;
  data_counter: number;
  monthly_data_multiplier: number;
  data_next_reset: number;
}

interface LiveInfo {
  ve_status: string;
  ve_used_disk_space_b: number;
  ve_disk_quota_gb: number;
  is_cpu_throttled: number;
  is_disk_throttled: number;
  ssh_port: number;
  load_average: string;
  mem_available_kb: number;
  swap_total_kb: number;
  swap_available_kb: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatKB(kb: number): string {
  if (kb > 1048576) return (kb / 1048576).toFixed(1) + " GB";
  if (kb > 1024) return (kb / 1024).toFixed(0) + " MB";
  return kb + " KB";
}

const statusMap: Record<string, { color: string; text: string }> = {
  Running: { color: "#52c41a", text: "运行中" },
  Stopped: { color: "#ff4d4f", text: "已停止" },
  Starting: { color: "#faad14", text: "启动中" },
};

export default function DashboardPage() {
  const [info, setInfo] = useState<ServiceInfo | null>(null);
  const [live, setLive] = useState<LiveInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [serviceData, liveData] = await Promise.all([
        bwhApi<ServiceInfo>("getServiceInfo"),
        bwhApi<LiveInfo>("getLiveServiceInfo").catch(() => null),
      ]);
      setInfo(serviceData);
      setLive(liveData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error || !info) {
    return <Alert type="error" message="加载失败" description={error} showIcon />;
  }

  const ips = Array.isArray(info.ip_addresses) ? info.ip_addresses : Object.values(info.ip_addresses || {});
  const ipv4 = ips.filter((ip: string) => !ip.includes(":"));
  const totalBandwidth = info.plan_monthly_data * (info.monthly_data_multiplier || 1);
  const usedBandwidth = info.data_counter * (info.monthly_data_multiplier || 1);
  const bandwidthPercent = totalBandwidth > 0 ? Math.round((usedBandwidth / totalBandwidth) * 100) : 0;
  const resetDate = info.data_next_reset
    ? new Date(info.data_next_reset * 1000).toLocaleDateString("zh-CN")
    : "未知";

  const status = live?.ve_status ? statusMap[live.ve_status] || { color: "#999", text: live.ve_status } : null;
  const memUsedPercent = live && live.mem_available_kb && live.swap_total_kb
    ? Math.max(0, Math.round((1 - live.mem_available_kb / (info.plan_ram / 1024)) * 100))
    : null;
  const diskUsedPercent = live && live.ve_disk_quota_gb
    ? Math.round((live.ve_used_disk_space_b / (live.ve_disk_quota_gb * 1073741824)) * 100)
    : null;

  return (
    <div>
      {/* Status Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="运行状态"
              value={status?.text || "未知"}
              valueStyle={{ color: status?.color }}
              prefix={<CloudServerOutlined />}
            />
            {live?.ssh_port && (
              <div style={{ marginTop: 8, color: "#888", fontSize: 12 }}>SSH 端口: {live.ssh_port}</div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="公网 IP"
              value={ipv4[0] || "N/A"}
              prefix={<GlobalOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
            <div style={{ marginTop: 8, color: "#888", fontSize: 12 }}>{info.node_location}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="可用内存"
              value={live ? formatKB(live.mem_available_kb) : formatBytes(info.plan_ram)}
              prefix={<DashboardOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
            <div style={{ marginTop: 8, color: "#888", fontSize: 12 }}>总内存: {formatBytes(info.plan_ram)}</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="系统负载"
              value={live?.load_average || "N/A"}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
            <div style={{ marginTop: 8 }}>
              {live?.is_cpu_throttled ? (
                <Tag color="red">CPU 节流</Tag>
              ) : (
                <Tag color="green">CPU 正常</Tag>
              )}
              {live?.is_disk_throttled ? (
                <Tag color="red">磁盘节流</Tag>
              ) : (
                <Tag color="green">IO 正常</Tag>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Usage Progress */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="带宽使用" extra={<Tag>{resetDate} 重置</Tag>}>
            <Progress
              percent={bandwidthPercent}
              status={bandwidthPercent > 90 ? "exception" : bandwidthPercent > 70 ? "active" : "success"}
              strokeColor={bandwidthPercent > 90 ? "#ff4d4f" : bandwidthPercent > 70 ? "#faad14" : "#52c41a"}
              format={() => `${formatBytes(usedBandwidth)} / ${formatBytes(totalBandwidth)}`}
            />
            <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", color: "#888", fontSize: 13 }}>
              <span>已使用 {bandwidthPercent}%</span>
              <span>剩余 {formatBytes(totalBandwidth - usedBandwidth)}</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="资源使用">
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>内存使用</span>
                  <span style={{ color: "#888" }}>{memUsedPercent !== null ? `${memUsedPercent}%` : "N/A"}</span>
                </div>
                <Progress percent={memUsedPercent || 0} size="small" showInfo={false}
                  strokeColor={(memUsedPercent || 0) > 80 ? "#ff4d4f" : "#1677ff"} />
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>磁盘使用</span>
                  <span style={{ color: "#888" }}>
                    {diskUsedPercent !== null
                      ? `${formatBytes(live!.ve_used_disk_space_b)} / ${live!.ve_disk_quota_gb} GB (${diskUsedPercent}%)`
                      : `0 / ${formatBytes(info.plan_disk)}`}
                  </span>
                </div>
                <Progress percent={diskUsedPercent || 0} size="small" showInfo={false}
                  strokeColor={(diskUsedPercent || 0) > 80 ? "#ff4d4f" : "#1677ff"} />
              </div>
              {live && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#888", fontSize: 13 }}>
                  <span>Swap: {formatKB(live.swap_available_kb)} 可用 / {formatKB(live.swap_total_kb)} 总计</span>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Server Details */}
      <Card title="服务器详情" extra={
        <a onClick={fetchData} style={{ cursor: "pointer", color: "#1677ff" }}>
          <InfoCircleOutlined /> 刷新
        </a>
      }>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered size="small">
          <Descriptions.Item label="主机名">{info.hostname}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={info.suspended ? "red" : "green"}>{info.suspended ? "已暂停" : "正常"}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="方案">{info.plan}</Descriptions.Item>
          <Descriptions.Item label="虚拟化">{info.vm_type?.toUpperCase()}</Descriptions.Item>
          <Descriptions.Item label="节点">{info.node_alias}</Descriptions.Item>
          <Descriptions.Item label="位置">{info.node_location}</Descriptions.Item>
          <Descriptions.Item label="操作系统">{info.os}</Descriptions.Item>
          <Descriptions.Item label="RAM / Swap">
            {formatBytes(info.plan_ram)} / {formatBytes(info.plan_swap)}
          </Descriptions.Item>
          <Descriptions.Item label="磁盘配额">{formatBytes(info.plan_disk)}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{info.email}</Descriptions.Item>
          <Descriptions.Item label="IP 地址">
            {ips.map((ip, i) => <div key={i} style={{ fontFamily: "monospace" }}>{ip}</div>)}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
