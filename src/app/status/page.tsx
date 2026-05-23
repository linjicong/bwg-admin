"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, Row, Col, Select, Spin, Alert, Space } from "antd";
import { Line } from "@ant-design/charts";

interface StatusRecord {
  id: number;
  veStatus: string | null;
  cpuUsage: number | null;
  memTotalKb: number | null;
  memAvailableKb: number | null;
  swapTotalKb: number | null;
  swapAvailableKb: number | null;
  diskUsedB: number | null;
  diskQuotaGb: number | null;
  loadAverage: string | null;
  isCpuThrottled: boolean | null;
  isDiskThrottled: boolean | null;
  dataCounter: number | null;
  recordedAt: string;
}

const rangeOptions = [
  { value: "1h", label: "最近 1 小时" },
  { value: "6h", label: "最近 6 小时" },
  { value: "24h", label: "最近 24 小时" },
  { value: "7d", label: "最近 7 天" },
  { value: "30d", label: "最近 30 天" },
];

function formatKb(kb: number): string {
  if (kb > 1048576) return (kb / 1048576).toFixed(1) + " GB";
  if (kb > 1024) return (kb / 1024).toFixed(0) + " MB";
  return kb + " KB";
}

function ChartCard({ title, data, yField, color, formatter }: {
  title: string;
  data: { time: string; value: number }[];
  yField: string;
  color: string;
  formatter?: (v: number) => string;
}) {
  if (data.length === 0) {
    return (
      <Card title={title}>
        <div style={{ textAlign: "center", padding: 40, color: "#999" }}>暂无数据</div>
      </Card>
    );
  }

  return (
    <Card title={title}>
      <Line
        data={data}
        xField="time"
        yField={yField}
        colorField={color}
        smooth
        point={{ sizeField: 2 }}
        style={{ lineWidth: 2 }}
        axis={{
          x: { labelAutoRotate: true, labelFormatter: (v: string) => v.slice(11, 16) },
          y: { labelFormatter: formatter || ((v: number) => `${v}%`) },
        }}
        tooltip={{ channel: "y", valueFormatter: formatter || ((v: number) => `${v?.toFixed(2)}%`) }}
        height={250}
      />
    </Card>
  );
}

export default function StatusPage() {
  const [records, setRecords] = useState<StatusRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState("24h");

  const fetchData = async (r: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/status?range=${r}`);
      const json = await res.json();
      if (json.error !== 0) throw new Error(json.message);
      setRecords(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(range); }, [range]);

  const chartData = useMemo(() => {
    const formatTime = (d: string) => {
      const date = new Date(d);
      return date.toISOString().slice(0, 16).replace("T", " ");
    };

    return {
      cpu: records.map(r => ({ time: formatTime(r.recordedAt), value: r.cpuUsage ?? 0 })),
      mem: records.map(r => {
        const total = r.memTotalKb ?? 1;
        const available = r.memAvailableKb ?? 0;
        return { time: formatTime(r.recordedAt), value: Math.round((1 - available / total) * 10000) / 100 };
      }),
      disk: records.map(r => {
        const quotaBytes = (r.diskQuotaGb ?? 1) * 1073741824;
        return { time: formatTime(r.recordedAt), value: Math.round(((r.diskUsedB ?? 0) / quotaBytes) * 10000) / 100 };
      }),
      load: records.map(r => {
        const load = parseFloat(r.loadAverage || "0");
        return { time: formatTime(r.recordedAt), value: isNaN(load) ? 0 : load };
      }),
      network: records.reduce((acc, r, i) => {
        if (i === 0 || r.dataCounter == null) return acc;
        const prev = records[i - 1].dataCounter ?? 0;
        const diff = Math.max(0, r.dataCounter - prev);
        const timeDiff = (new Date(r.recordedAt).getTime() - new Date(records[i - 1].recordedAt).getTime()) / 1000;
        const rate = timeDiff > 0 ? diff / timeDiff : 0;
        acc.push({ time: formatTime(r.recordedAt), value: Math.round(rate / 1024 * 100) / 100 });
        return acc;
      }, [] as { time: string; value: number }[]),
    };
  }, [records]);

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <Select
          value={range}
          onChange={setRange}
          options={rangeOptions}
          style={{ width: 160 }}
        />
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
          <Spin size="large" tip="加载中..." />
        </div>
      ) : error ? (
        <Alert type="error" message="加载失败" description={error} showIcon />
      ) : records.length === 0 ? (
        <Alert
          type="info"
          message="暂无数据"
          description="定时采集任务启动后将自动采集服务器状态数据，请稍后再来查看。"
          showIcon
        />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <ChartCard title="CPU 使用率" data={chartData.cpu} yField="value" color="#1677ff" />
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard title="内存使用率" data={chartData.mem} yField="value" color="#52c41a" />
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard title="磁盘使用率" data={chartData.disk} yField="value" color="#faad14" />
          </Col>
          <Col xs={24} lg={12}>
            <ChartCard
              title="系统负载"
              data={chartData.load}
              yField="value"
              color="#ff4d4f"
              formatter={(v) => v.toFixed(2)}
            />
          </Col>
          <Col xs={24}>
            <Card title="网络流量速率">
              {chartData.network.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#999" }}>暂无数据</div>
              ) : (
                <Line
                  data={chartData.network}
                  xField="time"
                  yField="value"
                  color="#722ed1"
                  smooth
                  point={{ sizeField: 2 }}
                  style={{ lineWidth: 2 }}
                  axis={{
                    x: { labelAutoRotate: true, labelFormatter: (v: string) => v.slice(11, 16) },
                    y: { labelFormatter: (v: number) => `${v} KB/s` },
                  }}
                  tooltip={{ channel: "y", valueFormatter: (v: number) => `${v?.toFixed(2)} KB/s` }}
                  height={250}
                />
              )}
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
