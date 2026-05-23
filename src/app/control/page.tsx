"use client";

import { useState } from "react";
import { Card, Button, Space, Modal, Alert, message, Descriptions, Tag } from "antd";
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { bwhApi } from "@/lib/api";

export default function ControlPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const handleAction = (action: string, label: string, dangerous = false) => {
    if (dangerous) {
      Modal.confirm({
        title: `确认${label}?`,
        icon: <WarningOutlined style={{ color: "#ff4d4f" }} />,
        content: dangerous
          ? "此操作可能导致数据丢失，请确认您了解风险。"
          : `确定要${label}吗？`,
        okText: "确认",
        cancelText: "取消",
        okButtonProps: { danger: dangerous },
        onOk: () => executeAction(action, label),
      });
    } else {
      Modal.confirm({
        title: `确认${label}?`,
        content: `确定要${label}吗？`,
        okText: "确认",
        cancelText: "取消",
        onOk: () => executeAction(action, label),
      });
    }
  };

  const executeAction = async (action: string, label: string) => {
    setLoading(action);
    try {
      await bwhApi(action);
      message.success(`${label}成功`);
      setLastResult(`${label} - 操作成功 (${new Date().toLocaleTimeString()})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      message.error(`${label}失败: ${msg}`);
      setLastResult(`${label} - 操作失败: ${msg}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ display: "flex" }}>
      {lastResult && (
        <Alert
          message="最近操作结果"
          description={lastResult}
          type="info"
          showIcon
          closable
          onClose={() => setLastResult(null)}
        />
      )}

      <Card title="VPS 控制">
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="启动">
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleAction("start", "启动 VPS")}
              loading={loading === "start"}
            >
              启动
            </Button>
            <div style={{ marginTop: 4, color: "#888", fontSize: 12 }}>
              启动已停止的 VPS 实例
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="停止">
            <Button
              icon={<StopOutlined />}
              onClick={() => handleAction("stop", "停止 VPS")}
              loading={loading === "stop"}
            >
              停止
            </Button>
            <div style={{ marginTop: 4, color: "#888", fontSize: 12 }}>
              正常停止 VPS，数据会被安全保存
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="重启">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => handleAction("restart", "重启 VPS")}
              loading={loading === "restart"}
            >
              重启
            </Button>
            <div style={{ marginTop: 4, color: "#888", fontSize: 12 }}>
              重新启动 VPS 实例
            </div>
          </Descriptions.Item>

          <Descriptions.Item label="强制停止">
            <Button
              danger
              icon={<WarningOutlined />}
              onClick={() => handleAction("kill", "强制停止 VPS", true)}
              loading={loading === "kill"}
            >
              强制停止
            </Button>
            <div style={{ marginTop: 4, color: "#888", fontSize: 12 }}>
              强制停止卡死的 VPS，未保存的数据将丢失
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
}
