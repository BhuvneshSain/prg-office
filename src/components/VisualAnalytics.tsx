import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import type { RegisterEntry } from '../types';
import { motion } from 'framer-motion';

export default function VisualAnalytics({ 
  inward, outward, orders, myDocs 
}: { 
  inward: RegisterEntry[], 
  outward: RegisterEntry[], 
  orders: RegisterEntry[], 
  myDocs: RegisterEntry[] 
}) {
  // Aggregate monthly data for the last 6 months
  const trendData = useMemo(() => {
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toISOString().slice(0, 7)); // YYYY-MM
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

  // Aggregate project data for PieChart
  const projectData = useMemo(() => {
    const allEntries = [...inward, ...outward, ...orders, ...myDocs];
    const counts: Record<string, number> = {};
    
    allEntries.forEach(e => {
      const p = e.project || 'Global/Other';
      counts[p] = (counts[p] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 projects
  }, [inward, outward, orders, myDocs]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Trend Area Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2 glass-card p-8 rounded-[40px] border-[var(--border-primary)] shadow-glass h-[400px]"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Temporal Vector</h3>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Operational Flow Analysis (6M)</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500" />
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Inward</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500" />
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Outward</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorInward" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOutward" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 'bold' }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="inward" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorInward)" 
              />
              <Area 
                type="monotone" 
                dataKey="outward" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorOutward)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Project Pie Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-8 rounded-[40px] border-[var(--border-primary)] shadow-glass h-[400px] flex flex-col"
      >
        <div className="mb-8 text-center sm:text-left">
          <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">Strategic Spread</h3>
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Payload Distribution by Segment</p>
        </div>

        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={projectData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {projectData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }} 
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ 
                  fontSize: '9px', 
                  fontWeight: 'bold', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em',
                  paddingTop: '20px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
