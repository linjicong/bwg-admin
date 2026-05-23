"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Input,
  Button,
  Select,
  Switch,
  Table,
  Tag,
  message,
  Descriptions,
  Tabs,
  Space,
  Modal,
} from "antd";
import { ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { bwhApi } from "@/lib/api";

export default function SettingsPage() {
  return (
    <Tabs
      defaultActiveKey="hostname"
      items={[
        { key: "hostname", label: "主机名", children: <HostnamePanel /> },
        { key: "notifications", label: "通知偏好", children: <NotificationsPanel /> },
        { key: "migration", label: "数据中心迁移", children: <MigrationPanel /> },
        { key: "audit", label: "审计日志", children: <AuditLogPanel /> },
      ]}
    />
  );
}

// --- Hostname ---
function HostnamePanel() {
  const [hostname, setHostname] = useState("");
  const [newHostname, setNewHostname] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bwhApi<{ hostname: string }>("getServiceInfo");
      setHostname(data.hostname || "");
      setNewHostname(data.hostname || "");
    } catch (err) {
      message.error("获取主机名失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!newHostname.trim()) {
      message.warning("主机名不能为空");
      return;
    }
    setLoading(true);
    try {
      await bwhApi("setHostname", { hostname: newHostname });
      setHostname(newHostname);
      message.success("主机名已更新");
    } catch (err) {
      message.error("更新失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="当前主机名">{hostname}</Descriptions.Item>
        <Descriptions.Item label="新主机名">
          <Space>
            <Input
              value={newHostname}
              onChange={(e) => setNewHostname(e.target.value)}
              placeholder="my.server.com"
              style={{ width: 300 }}
            />
            <Button type="primary" onClick={handleSave} loading={loading}>
              更新
            </Button>
          </Space>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

// --- Notifications ---
function NotificationsPanel() {
  const [prefs, setPrefs] = useState<Record<string, number>>({});
  const [descriptions, setDescriptions] = useState<Record<string, string>>({});
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bwhApi<{
        email_preferences: Record<string, number>;
        notificationEmail: string;
      }>("getNotificationPreferences");
      setPrefs(data.email_preferences || {});
      setEmail(data.notificationEmail || "");
    } catch (err) {
      message.error("获取通知设置失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (key: string, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value ? 1 : 0 };
    setPrefs(newPrefs);
    try {
      await bwhApi("setNotificationPreferences", {
        json_notification_preferences: JSON.stringify(newPrefs),
      });
      message.success("通知偏好已更新");
    } catch (err) {
      setPrefs(prefs);
      message.error("更新失败: " + (err instanceof Error ? err.message : ""));
    }
  };

  return (
    <Card
      title={`通知邮箱: ${email}`}
      extra={<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新</Button>}
    >
      <Descriptions column={1} bordered size="small">
        {Object.entries(prefs).map(([key, value]) => (
          <Descriptions.Item key={key} label={descriptions[key] || key}>
            <Switch
              checked={value === 1}
              onChange={(checked) => handleToggle(key, checked)}
            />
          </Descriptions.Item>
        ))}
        {Object.keys(prefs).length === 0 && (
          <Descriptions.Item label="通知偏好">
            {loading ? "加载中..." : "无可用设置"}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
}

// --- Migration ---
function MigrationPanel() {
  const [locations, setLocations] = useState<{
    currentLocation: string;
    locations: string[];
    descriptions: string[];
    dataTransferMultipliers: number[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bwhApi<typeof locations>("getMigrationLocations");
      setLocations(data);
    } catch (err) {
      message.error("获取迁移位置失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleMigrate = () => {
    if (!selected) {
      message.warning("请选择目标位置");
      return;
    }

    Modal.confirm({
      title: "确认迁移?",
      icon: <WarningOutlined style={{ color: "#ff4d4f" }} />,
      content: "迁移将导致所有 IPv4 地址被替换，VPS 将停机一段时间。",
      okText: "确认迁移",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const data = await bwhApi<{ newIps: string[] }>("startMigration", { location: selected });
          message.success("迁移已启动");
          if (data.newIps) {
            Modal.info({
              title: "新 IP 地址",
              content: data.newIps.map((ip: string) => <div key={ip}>{ip}</div>),
            });
          }
        } catch (err) {
          message.error("迁移失败: " + (err instanceof Error ? err.message : ""));
        }
      },
    });
  };

  return (
    <Card
      extra={<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新</Button>}
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="当前位置">
          <Tag color="blue">{locations?.currentLocation || "加载中..."}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="目标位置">
          <Space>
            <Select
              style={{ width: 300 }}
              placeholder="选择目标位置"
              value={selected || undefined}
              onChange={setSelected}
              loading={loading}
              options={
                locations?.locations?.map((loc, i) => ({
                  label: `${locations.descriptions[i]} (${loc})`,
                  value: loc,
                })) || []
              }
            />
            <Button danger type="primary" onClick={handleMigrate} disabled={!selected}>
              开始迁移
            </Button>
          </Space>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

// --- Audit Log ---
function AuditLogPanel() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bwhApi<{ logs: Record<string, unknown>[] }>("getAuditLog");
      const list = data.logs;
      const raw = (Array.isArray(list) ? list : Object.values(list || {})) as Record<string, unknown>[];
      setLogs(raw.map((item, i) => ({ ...item, _id: i })));
    } catch (err) {
      message.error("获取审计日志失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const columns: ColumnsType<Record<string, unknown>> = [
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (v: number) => (v ? new Date(v * 1000).toLocaleString("zh-CN") : "-"),
    },
    { title: "操作", dataIndex: "action", key: "action" },
    { title: "详情", dataIndex: "details", key: "details", ellipsis: true },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: string) => (
        <Tag color={v === "success" ? "green" : "red"}>{v || "-"}</Tag>
      ),
    },
  ];

  return (
    <Card
      extra={<Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>刷新</Button>}
    >
      <Table
        columns={columns}
        dataSource={logs}
        rowKey={(record) => String(record._id)}
        loading={loading}
        size="small"
        pagination={{ pageSize: 20 }}
      />
    </Card>
  );
}
