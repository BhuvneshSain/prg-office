import React, { useState, memo } from 'react';
import type { RegisterEntry } from '../types';
import { BarChart3, TrendingUp, Hash, AlertOctagon, Files } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentModal from './DocumentModal';
import AuditLogs from './AuditLogs';
import VisualAnalytics from './VisualAnalytics';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Reports = memo(function Reports({
  inward, outward, orders, myDocs
}: {
  inward: RegisterEntry[],
  outward: RegisterEntry[],
  orders: RegisterEntry[],
  myDocs: RegisterEntry[]
}) {
  // Stat totals
  const stats = React.useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const totalInward = inward.length;
    const totalOutward = outward.length;
    const totalOrders = orders.length;
    const totalMyDocs = myDocs.length;
    const totalDocs = totalInward + totalOutward + totalOrders + totalMyDocs;
    
    const thisMonthInward = inward.filter(i => i.date.startsWith(currentMonth)).length;
    const thisMonthOutward = outward.filter(o => o.date.startsWith(currentMonth)).length;
    const thisMonthOrders = orders.filter(o => o.date.startsWith(currentMonth)).length;
    const thisMonthMyDocs = myDocs.filter(m => m.date.startsWith(currentMonth)).length;

    return {
      totalInward, totalOutward, totalOrders, totalMyDocs, totalDocs,
      thisMonthInward, thisMonthOutward, thisMonthOrders, thisMonthMyDocs
    };
  }, [inward, outward, orders, myDocs]);

  const {
    totalInward, totalOutward, totalOrders, totalMyDocs, totalDocs,
    thisMonthInward, thisMonthOutward, thisMonthOrders, thisMonthMyDocs
  } = stats;

  const [selectedEntry, setSelectedEntry] = useState<RegisterEntry | null>(null);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <motion.div 
        animate={{ opacity: 1 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-cyber-violet" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Intelligence Node</p>
          </div>
          <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tight leading-none">Analytics Terminal</h2>
          <p className="text-[var(--text-secondary)] text-sm font-bold mt-3 max-w-xl leading-relaxed">
            Synthesized operational data and chronological audit logs across all office verticals.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 bg-[var(--header-bg)] backdrop-blur-md rounded-2xl border border-[var(--border-primary)] shadow-sm"
          >
            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none mb-1">Status</p>
            <p className="text-xs font-black text-emerald-500 uppercase tracking-tight flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Analysis
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Stat Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <StatCard title="Global Payload" value={totalDocs} icon={<Hash />} subtitle="All Entries" accent="indigo" />
        <StatCard title="Inward Vector" value={totalInward} icon={<TrendingUp />} subtitle={`${thisMonthInward} Monthly`} accent="blue" />
        <StatCard title="Outward Vector" value={totalOutward} icon={<TrendingUp className="rotate-180" />} subtitle={`${thisMonthOutward} Monthly`} accent="emerald" />
        <StatCard title="Priority Orders" value={totalOrders} icon={<AlertOctagon />} subtitle={`${thisMonthOrders} Monthly`} accent="amber" />
        <StatCard title="Library Assets" value={totalMyDocs} icon={<Files />} subtitle={`${thisMonthMyDocs} Monthly`} accent="violet" />
      </div>

      {/* Visual Analytics Layer */}
      <VisualAnalytics 
        inward={inward} 
        outward={outward} 
        orders={orders} 
        myDocs={myDocs} 
      />

      {/* Audit Log Terminal */}
      <motion.div 
        layout
        className="glass-card rounded-[40px] border-[var(--border-primary)] shadow-glass overflow-hidden"
      >
        <AuditLogs />
      </motion.div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedEntry && (
          <DocumentModal 
            key="report-modal"
            entry={selectedEntry} 
            onClose={() => setSelectedEntry(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default Reports;

function StatCard({ title, value, icon, subtitle, accent }: { title: string; value: number | string; icon: React.ReactNode; subtitle: string; accent: 'indigo' | 'blue' | 'emerald' | 'amber' | 'violet' }) {
  const styles = {
    indigo: "from-indigo-600 to-cyber-violet text-indigo-600 shadow-indigo-100/50",
    blue: "from-blue-600 to-cyan-600 text-blue-600 shadow-blue-100/50",
    emerald: "from-emerald-600 to-teal-600 text-emerald-600 shadow-emerald-100/50",
    amber: "from-amber-600 to-orange-600 text-amber-600 shadow-amber-100/50",
    violet: "from-violet-600 to-purple-600 text-violet-600 shadow-violet-100/50",
  }[accent];

  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="group relative h-full"
    >
      <div className={cn("absolute inset-0 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br rounded-3xl", styles)} />
      
      <div className="relative h-full glass-card p-5 sm:p-6 rounded-[32px] border-[var(--glass-border)] shadow-glass flex flex-col items-center text-center">
        <div className={cn("w-14 h-14 rounded-2xl bg-[var(--bg-surface)] shadow-sm flex items-center justify-center mb-6 border border-[var(--border-primary)] transition-transform group-hover:scale-110", styles)}>
          <div className="w-6 h-6">{icon}</div>
        </div>
        
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">{title}</p>
        <h3 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-3">
          {value}
        </h3>
        
        <div className="mt-auto pt-4 border-t border-[var(--border-primary)] w-full">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}
