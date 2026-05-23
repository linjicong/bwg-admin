"use client";

import { useEffect, useState } from "react";
import { Card, Table, Button, Space, Tag, message, Popconfirm } from "antd";
import { ReloadOutlined, CopyOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { bwhApi } from "@/lib/api";

interface Backup {
  backupToken: string;
  size: number;
  os: string;
  md5: string;
  timestamp: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const data = await bwhApi<{ backups: Backup[] }>("listBackups");
      const list = data.backups;
      setBackups(Array.isArray(list) ? list : Object.values(list || {}));
    } catch (err) {
      message.error("获取备份列表失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBackups(); }, []);

  const handleCopyToSnapshot = async (backupToken: string) => {
    setActionLoading(backupToken);
    try {
      await bwhApi("backupCopyToSnapshot", { backupToken });
      message.success("已复制为快照");
    } catch (err) {
      message.error("操作失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setActionLoading(null);
    }
  };

  const columns: ColumnsType<Backup> = [
    {
      title: "备份时间",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (v: number) => new Date(v * 1000).toLocaleString("zh-CN"),
    },
    { title: "系统", dataIndex: "os", key: "os" },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      render: (v: number) => formatBytes(v),
    },
    { title: "MD5", dataIndex: "md5", key: "md5", ellipsis: true },
    {
      title: "状态",
      key: "status",
      render: () => <Tag color="green">可用</Tag>,
    },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="复制为快照？"
          description="将此备份复制为可恢复的快照"
          onConfirm={() => handleCopyToSnapshot(record.backupToken)}
        >
          <Button
            size="small"
            type="primary"
            icon={<CopyOutlined />}
            loading={actionLoading === record.backupToken}
          >
            复制为快照
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card
      title="备份管理"
      extra={
        <Button icon={<ReloadOutlined />} onClick={fetchBackups} loading={loading}>
          刷新
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={backups}
        rowKey="backupToken"
        loading={loading}
        size="small"
        pagination={false}
      />
    </Card>
  );
}
