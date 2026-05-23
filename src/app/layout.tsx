import React from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import AppLayout from "@/components/AppLayout";
import "./globals.css";

export const metadata = {
  title: "BWH Admin - 搬瓦工管理后台",
  description: "基于 KiwiVM API 的搬瓦工 VPS 管理面板",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: "#1677ff" } }}>
            <AppLayout>{children}</AppLayout>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
