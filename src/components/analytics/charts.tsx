"use client";
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { currency } from "@/lib/calculations";

const colors = ["#ff405d", "#69b8ff", "#ff83b7", "#9d8bff", "#e7eaff", "#4388ed", "#da4c9e"];

export function CategoryChart({
  data,
  currencyCode,
}: {
  data: { name: string; value: number }[];
  currencyCode: string;
}) {
  return (
    <div role="img" aria-label={`Monthly equivalents by category: ${data.map(({ name, value }) => `${name}, ${currency(value, currencyCode)}`).join("; ")}`}>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={88} paddingAngle={3}>
            {data.map((category, index) => <Cell key={category.name} fill={colors[index % colors.length]}/>)}
          </Pie>
          <Tooltip formatter={(value) => [currency(Number(value), currencyCode)]}/>
          <Legend iconType="circle"/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostChart({
  data,
  currencyCode,
}: {
  data: { name: string; monthly: number }[];
  currencyCode: string;
}) {
  return (
    <div role="img" aria-label={`Monthly equivalent by subscription: ${data.map(({ name, monthly }) => `${name}, ${currency(monthly, currencyCode)}`).join("; ")}`}>
      <ResponsiveContainer width="100%" height={270}>
        <BarChart data={data} margin={{ left: -16, right: 8, top: 8 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#b2b0bc" }}/>
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#b2b0bc" }}/>
          <Tooltip formatter={(value) => [currency(Number(value), currencyCode), "Monthly equivalent"]}/>
          <Bar dataKey="monthly" fill="#ff405d" radius={[5, 5, 0, 0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
