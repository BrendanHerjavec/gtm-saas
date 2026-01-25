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
import { formatCurrency } from "@/lib/utils";

type Deal = {
  id: string;
  value: number;
};

type DealStage = {
  id: string;
  name: string;
  probability: number;
  order: number;
};

type StageWithDeals = DealStage & {
  deals: Deal[];
};

interface DealPipelineChartProps {
  stages: StageWithDeals[];
}

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#22c55e",
  "#10b981",
];

export function DealPipelineChart({ stages }: DealPipelineChartProps) {
  if (stages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        No pipeline data available
      </div>
    );
  }

  const chartData = stages.map((stage) => ({
    name: stage.name,
    value: stage.deals.reduce((sum, deal) => sum + Number(deal.value), 0),
    count: stage.deals.length,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value) => [formatCurrency(value as number), "Value"]}
          labelFormatter={(label) => `Stage: ${label}`}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
