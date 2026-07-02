import React, { useState, memo } from 'react';
import type { RegisterEntry } from '../types';
import { BarChart3, TrendingUp, Hash, AlertOctagon, Files } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import DocumentModal from './DocumentModal';
import AuditLogs from './AuditLogs';
import VisualAnalytics from './VisualAnalytics';

const Reports = memo(function Reports({
  inward, outward, orders
}: {
  inward: RegisterEntry[],
  outward: RegisterEntry[],
  orders: RegisterEntry[]
}) {
  const stats = React.useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const totalInward = inward.length;
    const totalOutward = outward.length;
    const totalOrders = orders.length;
    const totalDocs = totalInward + totalOutward + totalOrders;

    const thisMonthInward = inward.filter(i => i.date.startsWith(currentMonth)).length;
    const thisMonthOutward = outward.filter(o => o.date.startsWith(currentMonth)).length;
    const thisMonthOrders = orders.filter(o => o.date.startsWith(currentMonth)).length;

    return {
      totalInward, totalOutward, totalOrders, totalDocs,
      thisMonthInward, thisMonthOutward, thisMonthOrders
    };
  }, [inward, outward, orders]);

  const {
    totalInward, totalOutward, totalOrders, totalDocs,
    thisMonthInward, thisMonthOutward, thisMonthOrders
  } = stats;

  const [selectedEntry, setSelectedEntry] = useState<RegisterEntry | null>(null);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-muted" />
            <p className="font-mono text-[10px] text-muted tracking-[0.18em] uppercase">Intelligence</p>
          </div>
          <h2 className="font-serif-display italic text-3xl leading-none">Analytics Terminal</h2>
          <p className="font-serif-body text-muted text-sm mt-2 max-w-xl leading-relaxed">
            Synthesized operational data and chronological audit logs across all office verticals.
          </p>
        </div>

        <div className="border border-rule px-4 py-2">
          <p className="font-mono text-[10px] text-muted tracking-[0.16em] uppercase">Status</p>
          <p className="font-mono text-[11px] text-good uppercase tracking-[0.1em] flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-good" /> Live
          </p>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Entries" value={totalDocs} icon={<Hash />} subtitle="All registers" />
        <StatCard title="Inward" value={totalInward} icon={<TrendingUp />} subtitle={`${thisMonthInward} this month`} />
        <StatCard title="Outward" value={totalOutward} icon={<TrendingUp className="rotate-180" />} subtitle={`${thisMonthOutward} this month`} />
        <StatCard title="Orders" value={totalOrders} icon={<AlertOctagon />} subtitle={`${thisMonthOrders} this month`} />
      </div>

      {/* Visual Analytics */}
      <VisualAnalytics
        inward={inward}
        outward={outward}
        orders={orders}
      />

      {/* Audit Log */}
      <div className="border border-rule overflow-hidden">
        <AuditLogs />
      </div>

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

function StatCard({ title, value, icon, subtitle }: { title: string; value: number | string; icon: React.ReactNode; subtitle: string }) {
  return (
    <div className="border border-rule p-4 flex flex-col items-center text-center">
      <div className="text-muted mb-3">
        <div className="w-5 h-5">{icon}</div>
      </div>
      <p className="font-mono text-[10px] text-muted tracking-[0.18em] uppercase mb-1.5">{title}</p>
      <h3 className="font-serif-display text-3xl leading-none mb-2" style={{ fontFeatureSettings: "'tnum'" }}>
        {value}
      </h3>
      <p className="font-mono text-[10px] text-muted tracking-[0.1em] uppercase mt-auto pt-2 border-t border-rule w-full">{subtitle}</p>
    </div>
  );
}
