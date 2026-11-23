"use client";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { currency } from "@/lib/calculations";

export default function SpendingChart({
  data,
  currencyCode,
}: {
  data: { month: string; spend: number }[];
  currencyCode: string;
}) {
  return (
    <div className="chart-container" role="img" aria-label={`Recorded paid amounts: ${data.map(({ month, spend }) => `${month}, ${currency(spend, currencyCode)}`).join("; ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 14, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#343846"/>
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#b2b0bc", fontSize: 11 }}/>
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#b2b0bc", fontSize: 10 }}/>
          <Tooltip
            formatter={(value) => [currency(Number(value), currencyCode), "Recorded paid amount"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #393d4b", background: "#1a1e29", color: "#f5f3f6", boxShadow: "0 8px 24px rgb(0 0 0 / 28%)" }}
          />
          <Line type="monotone" dataKey="spend" stroke="#ff637d" strokeWidth={2.5} dot={{ r: 3, fill: "#ff637d", strokeWidth: 0 }} activeDot={{ r: 5 }}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
