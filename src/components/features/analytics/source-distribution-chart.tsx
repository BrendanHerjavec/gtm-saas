"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SourceDistributionChartProps {
  data: Record<string, number> | undefined;
}

const sourceLabels: Record<string, string> = {
  WEBSITE: "Website",
  REFERRAL: "Referral",
  LINKEDIN: "LinkedIn",
  COLD_OUTREACH: "Cold Outreach",
  EVENT: "Event",
  ADVERTISING: "Advertising",
  OTHER: "Other",
};

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#6b7280",
];

export function SourceDistributionChart({ data }: SourceDistributionChartProps) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No source data available
      </div>
    );
  }

  const chartData = Object.entries(data)
    .filter(([, value]) => value > 0)
    .map(([source, value]) => ({
      name: sourceLabels[source] || source,
      value,
    }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
          labelLine={false}
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [value, "Leads"]}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
