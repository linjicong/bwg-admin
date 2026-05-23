"use client";

import { useEffect, useState } from "react";
import { Card, Descriptions, Tag, Button, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
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
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function ServiceInfoCard() {
  const [info, setInfo] = useState<ServiceInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bwhApi<ServiceInfo>("getServiceInfo");
      setInfo(data);
    } catch (err) {
      message.error("获取服务信息失败: " + (err instanceof Error ? err.message : "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (!info) return <Card loading={loading} title="服务信息" />;

  return (
    <Card
      title="服务信息"
      extra={<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} size="small">刷新</Button>}
    >
      <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
        <Descriptions.Item label="主机名">{info.hostname}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={info.suspended ? "red" : "green"}>
            {info.suspended ? "已暂停" : "正常"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="方案">{info.plan}</Descriptions.Item>
        <Descriptions.Item label="虚拟化">{info.vm_type?.toUpperCase()}</Descriptions.Item>
        <Descriptions.Item label="节点">{info.node_alias}</Descriptions.Item>
        <Descriptions.Item label="位置">{info.node_location}</Descriptions.Item>
        <Descriptions.Item label="操作系统">{info.os}</Descriptions.Item>
        <Descriptions.Item label="邮箱">{info.email}</Descriptions.Item>
        <Descriptions.Item label="RAM">{formatBytes(info.plan_ram)}</Descriptions.Item>
        <Descriptions.Item label="SWAP">{formatBytes(info.plan_swap)}</Descriptions.Item>
        <Descriptions.Item label="磁盘">{formatBytes(info.plan_disk)}</Descriptions.Item>
        <Descriptions.Item label="IP 地址">
          {(Array.isArray(info.ip_addresses) ? info.ip_addresses : Object.values(info.ip_addresses || {})).map((ip, i) => <div key={i}>{ip}</div>)}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
