import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import type { RegisterEntry } from '../types';
import { motion } from 'framer-motion';

export default function VisualAnalytics({
  inward, outward, orders
}: {
  inward: RegisterEntry[],
  outward: RegisterEntry[],
  orders: RegisterEntry[]
}) {
  const trendData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7));
    }
    return months.map(m => {
      const name = new Date(m + '-01').toLocaleDateString('default', { month: 'short' });
      return {
        name,
        month: m,
        inward: inward.filter(i => i.date.startsWith(m)).length,
        outward: outward.filter(o => o.date.startsWith(m)).length,
        combined: (inward.filter(i => i.date.startsWith(m)).length + outward.filter(o => o.date.startsWith(m)).length)
      };
    });
  }, [inward, outward]);

  const projectData = useMemo(() => {
    const allEntries = [...inward, ...outward, ...orders];
    const counts: Record<string, number> = {};
    allEntries.forEach(e => {
      const p = e.project || 'Global/Other';
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [inward, outward, orders]);

  const COLORS = ['#c14a2b', '#1f1c14', '#7a7264', '#406b3a', '#d6cdb6'];

  const tooltipStyle = {
    backgroundColor: '#f9f3e7',
    border: '1px solid #d6cdb6',
    borderRadius: '0',
    fontWeight: 'normal' as const,
    fontSize: '11px',
    fontFamily: "'IBM Plex Mono', monospace",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Trend Area Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 border border-rule p-5 sm:p-6 h-[360px]"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-serif-display italic text-lg">entries — <em>last 6 months</em></h3>
            <p className="font-mono text-[10px] text-muted tracking-[0.16em] uppercase mt-1">Inward + Outward trend</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-accent" />
              <span className="font-mono text-[10px] text-muted uppercase">Inward</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-ink" />
              <span className="font-mono text-[10px] text-muted uppercase">Outward</span>
            </div>
          </div>
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorInward" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c14a2b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#c14a2b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutward" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1f1c14" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#1f1c14" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6cdb6" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#7a7264', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7a7264', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="inward" stroke="#c14a2b" strokeWidth={2} fillOpacity={1} fill="url(#colorInward)" />
              <Area type="monotone" dataKey="outward" stroke="#1f1c14" strokeWidth={2} fillOpacity={1} fill="url(#colorOutward)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Project Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border border-rule p-5 sm:p-6 h-[360px] flex flex-col"
      >
        <div className="mb-6">
          <h3 className="font-serif-display italic text-lg">projects — <em>distribution</em></h3>
          <p className="font-mono text-[10px] text-muted tracking-[0.16em] uppercase mt-1">Top 5 by entry count</p>
        </div>

        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={projectData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {projectData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="square"
                iconSize={8}
                wrapperStyle={{
                  fontSize: '10px',
                  fontFamily: "'IBM Plex Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  paddingTop: '16px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
