"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  message,
  Popconfirm,
  Tabs,
  Typography,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { bwhApi } from "@/lib/api";

export default function NetworkPage() {
  return (
    <Tabs
      defaultActiveKey="ipv6"
      items={[
        { key: "ipv6", label: "IPv6 管理", children: <Ipv6Panel /> },
        { key: "private", label: "私有 IP", children: <PrivateIpPanel /> },
        { key: "ptr", label: "PTR 记录", children: <PtrPanel /> },
        { key: "ssh", label: "SSH 密钥", children: <SshPanel /> },
      ]}
    />
  );
}

// --- IPv6 Panel ---
function Ipv6Panel() {
  const [ips, setIps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bwhApi<{ ip_addresses: string[] | Record<string, string> }>("getServiceInfo");
      const allIps = Array.isArray(data.ip_addresses) ? data.ip_addresses : Object.values(data.ip_addresses || {});
      const ipv6List = allIps.filter((ip: string) => ip.includes(":"));
      setIps(ipv6List);
    } catch (err) {
      message.error("获取 IPv6 失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    try {
      const data = await bwhApi<{ assigned_subnet: string }>("addIpv6");
      message.success("IPv6 子网已分配: " + data.assigned_subnet);
      fetchData();
    } catch (err) {
      message.error("分配失败: " + (err instanceof Error ? err.message : ""));
    }
  };

  const handleDelete = async (ip: string) => {
    try {
      await bwhApi("deleteIpv6", { ip });
      message.success("IPv6 已释放");
      fetchData();
    } catch (err) {
      message.error("释放失败: " + (err instanceof Error ? err.message : ""));
    }
  };

  const columns: ColumnsType<{ ip: string }> = [
    { title: "IPv6 /64 子网", dataIndex: "ip", key: "ip" },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Popconfirm title="确定释放此 IPv6？" onConfirm={() => handleDelete(record.ip)}>
          <Button size="small" danger icon={<DeleteOutlined />}>释放</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>分配 IPv6</Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新</Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={ips.map((ip) => ({ ip }))}
        rowKey="ip"
        loading={loading}
        size="small"
        pagination={false}
      />
    </Card>
  );
}

// --- Private IP Panel ---
function PrivateIpPanel() {
  const [availableIps, setAvailableIps] = useState<string[]>([]);
  const [assignedIps, setAssignedIps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [available, info] = await Promise.all([
        bwhApi<{ available_ips: string[] | Record<string, string> }>("getAvailablePrivateIps"),
        bwhApi<{ private_ip_addresses: string[] | Record<string, string> }>("getServiceInfo"),
      ]);
      const availList = available.available_ips;
      const assignList = info.private_ip_addresses;
      setAvailableIps(Array.isArray(availList) ? availList : Object.values(availList || {}));
      setAssignedIps(Array.isArray(assignList) ? assignList : Object.values(assignList || {}));
    } catch (err) {
      message.error("获取私有 IP 失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (ip?: string) => {
    try {
      await bwhApi("assignPrivateIp", ip ? { ip } : {});
      message.success("私有 IP 已分配");
      fetchData();
    } catch (err) {
      message.error("分配失败: " + (err instanceof Error ? err.message : ""));
    }
  };

  const handleDelete = async (ip: string) => {
    try {
      await bwhApi("deletePrivateIp", { ip });
      message.success("私有 IP 已删除");
      fetchData();
    } catch (err) {
      message.error("删除失败: " + (err instanceof Error ? err.message : ""));
    }
  };

  return (
    <Card
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAssign()}>
            随机分配
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新</Button>
        </Space>
      }
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="已分配的私有 IP">
          {assignedIps.length > 0 ? (
            assignedIps.map((ip) => (
              <Tag key={ip} color="blue" closable onClose={() => handleDelete(ip)}>
                {ip}
              </Tag>
            ))
          ) : (
            <Typography.Text type="secondary">无</Typography.Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="可用的私有 IP">
          {availableIps.length > 0 ? (
            availableIps.map((ip) => (
              <Tag
                key={ip}
                color="green"
                style={{ cursor: "pointer" }}
                onClick={() => handleAssign(ip)}
              >
                {ip}
              </Tag>
            ))
          ) : (
            <Typography.Text type="secondary">无可用</Typography.Text>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

// --- PTR Panel ---
function PtrPanel() {
  const [ptr, setPtr] = useState<Record<string, string>>({});
  const [ips, setIps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editIp, setEditIp] = useState("");
  const [editPtr, setEditPtr] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bwhApi<{
        ip_addresses: string[] | Record<string, string>;
        ptr: Record<string, string>;
        rdns_api_available: number;
      }>("getServiceInfo");
      setPtr(data.ptr || {});
      const allIps = Array.isArray(data.ip_addresses) ? data.ip_addresses : Object.values(data.ip_addresses || {});
      setIps(allIps.filter((ip: string) => !ip.includes(":")));
    } catch (err) {
      message.error("获取 PTR 失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSetPtr = async () => {
    if (!editIp || !editPtr) {
      message.warning("请填写 IP 和 PTR 记录");
      return;
    }
    try {
      await bwhApi("setPTR", { ip: editIp, ptr: editPtr });
      message.success("PTR 记录已更新");
      setEditIp("");
      setEditPtr("");
      fetchData();
    } catch (err) {
      message.error("设置失败: " + (err instanceof Error ? err.message : ""));
    }
  };

  return (
    <Card
      extra={<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新</Button>}
    >
      <Descriptions column={1} bordered size="small">
        {ips.map((ip) => (
          <Descriptions.Item key={ip} label={ip}>
            {ptr[ip] || <Typography.Text type="secondary">未设置</Typography.Text>}
          </Descriptions.Item>
        ))}
        <Descriptions.Item label="设置 PTR">
          <Space>
            <Select
              style={{ width: 150 }}
              placeholder="选择 IP"
              value={editIp || undefined}
              onChange={setEditIp}
              options={ips.map((ip) => ({ label: ip, value: ip }))}
            />
            <Input
              placeholder="PTR 记录 (如 ns1.example.com)"
              value={editPtr}
              onChange={(e) => setEditPtr(e.target.value)}
              style={{ width: 250 }}
            />
            <Button type="primary" onClick={handleSetPtr}>设置</Button>
          </Space>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

// --- SSH Keys Panel ---
function SshPanel() {
  const [keys, setKeys] = useState<{
    ssh_keys_veid: string;
    ssh_keys_user: string;
    ssh_keys_preferred: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [newKeys, setNewKeys] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bwhApi<typeof keys>("getSshKeys");
      setKeys(data);
    } catch (err) {
      message.error("获取 SSH 密钥失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdate = async () => {
    if (!newKeys.trim()) {
      message.warning("请输入 SSH 公钥");
      return;
    }
    try {
      await bwhApi("updateSshKeys", { ssh_keys: newKeys });
      message.success("SSH 密钥已更新");
      setNewKeys("");
      fetchData();
    } catch (err) {
      message.error("更新失败: " + (err instanceof Error ? err.message : ""));
    }
  };

  return (
    <Card
      extra={<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新</Button>}
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="VM 级 SSH 密钥">
          <Typography.Text copyable={!!keys?.ssh_keys_veid} style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
            {keys?.ssh_keys_veid || "无"}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="账户级 SSH 密钥">
          <Typography.Text copyable={!!keys?.ssh_keys_user} style={{ fontSize: 12, whiteSpace: "pre-wrap" }}>
            {keys?.ssh_keys_user || "无"}
          </Typography.Text>
        </Descriptions.Item>
        <Descriptions.Item label="实际使用的密钥">
          <Tag color="blue">{keys?.ssh_keys_preferred ? "VM 级优先" : "无"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="更新 SSH 密钥">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Input.TextArea
              rows={4}
              placeholder="粘贴 SSH 公钥 (每行一个)"
              value={newKeys}
              onChange={(e) => setNewKeys(e.target.value)}
            />
            <Button type="primary" onClick={handleUpdate}>更新密钥</Button>
          </Space>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
