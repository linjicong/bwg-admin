"use client";

import { useEffect, useState } from "react";
import { Card, Select, Button, Alert, Modal, Descriptions, Tag, message, Typography, Space } from "antd";
import { ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import { bwhApi } from "@/lib/api";

interface OsInfo {
  installed: string;
  templates: string[];
}

interface ReinstallResult {
  rootPassword: string;
  sshPort: number;
  sshKeys: string;
  notificationEmail: string;
}

export default function OsPage() {
  const [osInfo, setOsInfo] = useState<OsInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOs, setSelectedOs] = useState<string>("");
  const [reinstalling, setReinstalling] = useState(false);
  const [result, setResult] = useState<ReinstallResult | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await bwhApi<OsInfo>("getAvailableOS");
      setOsInfo(data);
    } catch (err) {
      message.error("获取系统列表失败: " + (err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReinstall = () => {
    if (!selectedOs) {
      message.warning("请先选择一个操作系统");
      return;
    }

    Modal.confirm({
      title: "确认重装系统?",
      icon: <WarningOutlined style={{ color: "#ff4d4f" }} />,
      content: (
        <div>
          <p>此操作将 <strong>完全删除</strong> 当前系统和所有数据！</p>
          <p>目标系统: <Tag color="blue">{selectedOs}</Tag></p>
        </div>
      ),
      okText: "确认重装",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: async () => {
        setReinstalling(true);
        try {
          const data = await bwhApi<ReinstallResult>("reinstallOS", { os: selectedOs });
          setResult(data);
          message.success("系统重装已提交");
        } catch (err) {
          message.error("重装失败: " + (err instanceof Error ? err.message : ""));
        } finally {
          setReinstalling(false);
        }
      },
    });
  };

  return (
    <Space direction="vertical" size="large" style={{ display: "flex" }}>
      {result && (
        <Alert
          type="success"
          message="系统重装成功"
          description={
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Root 密码">
                <Typography.Text copyable>{result.rootPassword}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label="SSH 端口">{result.sshPort}</Descriptions.Item>
              <Descriptions.Item label="通知邮箱">{result.notificationEmail}</Descriptions.Item>
              {result.sshKeys && (
                <Descriptions.Item label="SSH 密钥">
                  <Typography.Text copyable={{ text: result.sshKeys }} style={{ fontSize: 12 }}>
                    {result.sshKeys.length > 80 ? result.sshKeys.substring(0, 80) + "..." : result.sshKeys}
                  </Typography.Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          }
          closable
          onClose={() => setResult(null)}
        />
      )}

      <Card
        title="系统安装"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            刷新
          </Button>
        }
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="当前系统">
            <Tag color="green">{osInfo?.installed || "加载中..."}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="选择新系统">
            <Select
              style={{ width: 400 }}
              placeholder="请选择要安装的操作系统"
              value={selectedOs || undefined}
              onChange={setSelectedOs}
              loading={loading}
              options={osInfo?.templates?.map((os) => ({ label: os, value: os }))}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
            />
          </Descriptions.Item>
          <Descriptions.Item label="操作">
            <Button
              danger
              type="primary"
              icon={<WarningOutlined />}
              onClick={handleReinstall}
              loading={reinstalling}
              disabled={!selectedOs}
            >
              重装系统
            </Button>
            <div style={{ marginTop: 4, color: "#888", fontSize: 12 }}>
              注意：重装系统将删除所有现有数据
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
