"use client";

import React, { useState } from "react";
import { Layout, Menu, Button, message } from "antd";
import {
  DashboardOutlined,
  PoweroffOutlined,
  CameraOutlined,
  CloudSyncOutlined,
  DesktopOutlined,
  GlobalOutlined,
  SettingOutlined,
  LogoutOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";

const { Sider, Content, Header } = Layout;

const menuItems = [
  { key: "/", icon: <DashboardOutlined />, label: "仪表盘" },
  { key: "/control", icon: <PoweroffOutlined />, label: "VPS 控制" },
  { key: "/snapshots", icon: <CameraOutlined />, label: "快照管理" },
  { key: "/backups", icon: <CloudSyncOutlined />, label: "备份管理" },
  { key: "/os", icon: <DesktopOutlined />, label: "系统安装" },
  { key: "/network", icon: <GlobalOutlined />, label: "网络管理" },
  { key: "/status", icon: <LineChartOutlined />, label: "状态监控" },
  { key: "/settings", icon: <SettingOutlined />, label: "设置" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Login page: render without sidebar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    message.success("已退出登录");
    router.push("/login");
    router.refresh();
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: collapsed ? 16 : 18,
            fontWeight: "bold",
          }}
        >
          {collapsed ? "BWH" : "BWH Admin"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            {menuItems.find((item) => item.key === pathname)?.label || "仪表盘"}
          </span>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出
          </Button>
        </Header>
        <Content style={{ margin: 24 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
