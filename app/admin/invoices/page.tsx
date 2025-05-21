'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type Order = {
  created_at: string;
  total_price: number;
  cost_price: number;
};
type ChartData = { month: string; revenue: number; profit: number };

export default function ReportsPage() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/orders/?page_size=1000');
        const { results } = (await res.json()) as { results: Order[] };
        const agg: Record<string, { revenue: number; cost: number }> = {};
        results.forEach(o => {
          const m = o.created_at.slice(0, 7);
          if (!agg[m]) agg[m] = { revenue: 0, cost: 0 };
          agg[m].revenue += o.total_price;
          agg[m].cost += o.cost_price;
        });
        const chart = Object.entries(agg)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, { revenue, cost }]) => ({ month, revenue, profit: revenue - cost }));
        setData(chart);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line name="Revenue" type="monotone" dataKey="revenue" dot={false} stroke="#a855f7" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Monthly Profit & Loss</CardTitle></CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line name="Profit" type="monotone" dataKey="profit" dot={false} stroke="#c084fc" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
