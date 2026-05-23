'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

interface SkillsChartProps {
  data: Array<{ skillName: string; count: number }>;
}

export function SkillsChart({ data }: SkillsChartProps) {
  if (!data || data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        No skills data available.
      </p>
    );
  }
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 12, right: 16, left: 16, bottom: 12 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            stroke="#64748b"
            fontSize={12}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="skillName"
            stroke="#64748b"
            fontSize={12}
            width={140}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
