"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { LeadStatus } from "@/actions/leads";

interface LeadFunnelChartProps {
  data: Record<string, number> | undefined;
}

const statusOrder = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED"];

const statusLabels: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  UNQUALIFIED: "Unqualified",
  CONVERTED: "Converted",
};

const statusColors: Record<string, string> = {
  NEW: "#3b82f6",
  CONTACTED: "#8b5cf6",
  QUALIFIED: "#22c55e",
  UNQUALIFIED: "#ef4444",
  CONVERTED: "#10b981",
};

export function LeadFunnelChart({ data }: LeadFunnelChartProps) {
  const chartData = statusOrder.map((status) => ({
    name: statusLabels[status],
    value: data?.[status] || 0,
    status,
  }));

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No lead data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={100} />
        <Tooltip
          formatter={(value) => [value, "Leads"]}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={statusColors[entry.status]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
