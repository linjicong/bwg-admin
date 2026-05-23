"use client";

import { Spin } from "antd";

export default function Loading({ tip = "加载中..." }: { tip?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
      <Spin tip={tip} size="large" />
    </div>
  );
}
