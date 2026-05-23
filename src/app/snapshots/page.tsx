"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Input,
  Tag,
  message,
  Popconfirm,
  Typography,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ImportOutlined,
  ExportOutlined,
  LockOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { bwhApi } from "@/lib/api";

interface Snapshot {
  fileName: string;
  os: string;
  description: string;
  size: number;
  md5: string;
  sticky: number;
  purgesIn: string;
  downloadLink: string;
  downloadLinkSSL: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function SnapshotsPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createDesc, setCreateDesc] = useState("");
  const [createVisible, setCreateVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [importVeid, setImportVeid] = useState("");
  const [importToken, setImportToken] = useState("");

  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const data = await bwhApi<{ snapshots: Snapshot[] }>("listSnapshots");
      const list = data.snapshots;
      setSnapshots(Array.isArray(list) ? list : Object.values(list || {}));
    } catch (err) {
      message.error("获取快照列表失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSnapshots(); }, []);

  const handleCreate = async () => {
    setActionLoading("create");
    try {
      await bwhApi("createSnapshot", createDesc ? { description: createDesc } : {});
      message.success("快照创建已提交");
      setCreateVisible(false);
      setCreateDesc("");
      fetchSnapshots();
    } catch (err) {
      message.error("创建失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (fileName: string) => {
    setActionLoading(fileName);
    try {
      await bwhApi("deleteSnapshot", { snapshot: fileName });
      message.success("快照已删除");
      fetchSnapshots();
    } catch (err) {
      message.error("删除失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (fileName: string) => {
    setActionLoading(fileName);
    try {
      await bwhApi("restoreSnapshot", { snapshot: fileName });
      message.success("快照恢复已提交");
    } catch (err) {
      message.error("恢复失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSticky = async (fileName: string, currentSticky: number) => {
    setActionLoading(fileName);
    try {
      await bwhApi("toggleSticky", { snapshot: fileName, sticky: currentSticky ? "0" : "1" });
      message.success(currentSticky ? "已取消锁定" : "已锁定快照");
      fetchSnapshots();
    } catch (err) {
      message.error("操作失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async (fileName: string) => {
    setActionLoading(fileName);
    try {
      const data = await bwhApi<{ token: string }>("exportSnapshot", { snapshot: fileName });
      Modal.info({
        title: "导出令牌",
        content: (
          <Typography.Paragraph copyable>{data.token}</Typography.Paragraph>
        ),
      });
    } catch (err) {
      message.error("导出失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setActionLoading(null);
    }
  };

  const handleImport = async () => {
    setActionLoading("import");
    try {
      await bwhApi("importSnapshot", { sourceVeid: importVeid, sourceToken: importToken });
      message.success("快照导入已提交");
      setImportVisible(false);
      setImportVeid("");
      setImportToken("");
      fetchSnapshots();
    } catch (err) {
      message.error("导入失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setActionLoading(null);
    }
  };

  const columns: ColumnsType<Snapshot> = [
    { title: "文件名", dataIndex: "fileName", key: "fileName", ellipsis: true },
    { title: "系统", dataIndex: "os", key: "os" },
    { title: "描述", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "大小",
      dataIndex: "size",
      key: "size",
      render: (v: number) => formatBytes(v),
    },
    {
      title: "锁定",
      dataIndex: "sticky",
      key: "sticky",
      render: (v: number) => (
        <Tag color={v ? "blue" : "default"}>{v ? "已锁定" : "未锁定"}</Tag>
      ),
    },
    { title: "过期", dataIndex: "purgesIn", key: "purgesIn" },
    {
      title: "操作",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Popconfirm title="确定恢复此快照？数据将被覆盖" onConfirm={() => handleRestore(record.fileName)}>
            <Button size="small" type="primary" loading={actionLoading === record.fileName}>
              恢复
            </Button>
          </Popconfirm>
          <Button
            size="small"
            icon={record.sticky ? <LockOutlined /> : <UnlockOutlined />}
            onClick={() => handleToggleSticky(record.fileName, record.sticky)}
            loading={actionLoading === record.fileName}
          />
          <Button
            size="small"
            icon={<ExportOutlined />}
            onClick={() => handleExport(record.fileName)}
            loading={actionLoading === record.fileName}
          >
            导出
          </Button>
          <Popconfirm title="确定删除此快照？" onConfirm={() => handleDelete(record.fileName)}>
            <Button size="small" danger icon={<DeleteOutlined />} loading={actionLoading === record.fileName} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="快照管理"
      extra={
        <Space>
          <Button icon={<ImportOutlined />} onClick={() => setImportVisible(true)}>
            导入
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
            创建快照
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchSnapshots} loading={loading}>
            刷新
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={snapshots}
        rowKey="fileName"
        loading={loading}
        size="small"
        pagination={false}
      />

      <Modal
        title="创建快照"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        confirmLoading={actionLoading === "create"}
      >
        <Input
          placeholder="快照描述（可选）"
          value={createDesc}
          onChange={(e) => setCreateDesc(e.target.value)}
        />
      </Modal>

      <Modal
        title="导入快照"
        open={importVisible}
        onOk={handleImport}
        onCancel={() => setImportVisible(false)}
        confirmLoading={actionLoading === "import"}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="源 VEID"
            value={importVeid}
            onChange={(e) => setImportVeid(e.target.value)}
          />
          <Input
            placeholder="导出令牌"
            value={importToken}
            onChange={(e) => setImportToken(e.target.value)}
          />
        </Space>
      </Modal>
    </Card>
  );
}
