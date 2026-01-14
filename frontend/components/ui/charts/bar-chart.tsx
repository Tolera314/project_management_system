'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BarChartProps {
  data: Array<{
    priority: string;
    count: number;
    color: string;
  }>;
}

export function BarChart({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="priority" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar 
          dataKey="count" 
          name="Tasks"
          radius={[4, 4, 0, 0]}
        >
          {data.map((entry, index) => (
            <Bar 
              key={`bar-${index}`} 
              dataKey="count" 
              name={entry.priority}
              fill={entry.color}
            />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
