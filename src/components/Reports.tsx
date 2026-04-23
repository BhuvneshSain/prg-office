import React, { useState, useMemo, memo } from 'react';
import type { RegisterEntry } from '../types';
import { BarChart3, TrendingUp, Calendar, Hash, AlertOctagon, Search, Filter, X, Files, LayoutGrid, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentModal from './DocumentModal';
import { ComboBox } from './ComboBox';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type FilterType = 'all' | 'inward' | 'outward' | 'orders' | 'essential-docs';

const Reports = memo(function Reports({
  inward, outward, orders, myDocs
}: {
  inward: RegisterEntry[],
  outward: RegisterEntry[],
  orders: RegisterEntry[],
  myDocs: RegisterEntry[]
}) {
  const allEntries = useMemo(() => [...inward, ...outward, ...orders, ...myDocs], [inward, outward, orders, myDocs]);

  // Stat totals
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

  // Filter state
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<RegisterEntry | null>(null);

  // All unique projects across registers
  const allProjects = useMemo(() => {
    const projs = allEntries.map(e => e.project).filter(Boolean) as string[];
    return Array.from(new Set(projs)).sort();
  }, [allEntries]);

  // Filtered + sorted activity
  const filtered = useMemo(() => {
    return allEntries
      .filter(item => {
        if (typeFilter !== 'all' && item.type !== typeFilter) return false;
        if (dateFrom && item.date < dateFrom) return false;
        if (dateTo && item.date > dateTo) return false;
        if (projectFilter && item.project !== projectFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          const haystack = [
            item.subject,
            item.partyName.replace(/\|\|\|/g, ' '),
            item.referenceNumber,
            item.project ?? '',
            item.remarks ?? ''
          ].join(' ').toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allEntries, typeFilter, search, dateFrom, dateTo, projectFilter]);

  const hasActiveFilters = typeFilter !== 'all' || search || dateFrom || dateTo || projectFilter;

  const clearFilters = () => {
    setTypeFilter('all');
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setProjectFilter('');
  };

  const typeStyles: Record<string, { badge: string; icon: React.JSX.Element; label: string }> = {
    inward: { 
      badge: 'bg-blue-50 text-blue-600 border-blue-100', 
      icon: <TrendingUp className="w-4 h-4" />, 
      label: 'Inward' 
    },
    outward: { 
      badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', 
      icon: <TrendingUp className="w-4 h-4 scale-y-[-1]" />, 
      label: 'Outward' 
    },
    orders: { 
      badge: 'bg-amber-50 text-amber-600 border-amber-100', 
      icon: <AlertOctagon className="w-4 h-4" />, 
      label: 'Order' 
    },
    'essential-docs': { 
      badge: 'bg-cyber-violet/5 text-cyber-violet border-cyber-violet/10', 
      icon: <Files className="w-4 h-4" />, 
      label: 'Asset' 
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-cyber-violet" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Intelligence Node</p>
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none">Analytics Terminal</h2>
          <p className="text-slate-400 text-sm font-bold mt-3 max-w-xl leading-relaxed">
            Synthesized operational data and chronological audit logs across all office verticals.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="px-4 py-2 bg-white/60 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm"
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
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

      {/* Audit Log Terminal */}
      <motion.div 
        layout
        className="glass-card rounded-[40px] border-white/60 shadow-glass overflow-hidden"
      >
        {/* Terminal Toolbar */}
        <div className="p-8 border-b border-white/40 bg-white/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-cyber-violet/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-cyber-violet" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Audit Log Terminal</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-1">
                  Chronological Stream <span className="w-1 h-1 rounded-full bg-slate-200" /> 
                  <span className="text-cyber-violet">{filtered.length} Indexed</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group flex-1 md:min-w-[300px]">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyber-violet transition-colors" />
                <input
                  type="text" placeholder="Scan records..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-12 pr-6 py-3.5 bg-white/60 border border-slate-200/60 rounded-[22px] text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet transition-all placeholder:text-slate-300 shadow-sm"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3.5 rounded-[22px] text-xs font-black uppercase tracking-widest transition-all",
                  showFilters || hasActiveFilters ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10" : "bg-white border border-slate-200 shadow-sm text-slate-500 hover:bg-slate-50"
                )}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan shadow-[0_0_8px_rgba(45,212,191,0.8)]" />}
              </motion.button>

              {hasActiveFilters && (
                <motion.button 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  onClick={clearFilters} 
                  className="p-3.5 rounded-[22px] bg-red-50 text-red-500 hover:bg-red-100 transition-colors shadow-sm"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-8 mt-8 border-t border-white/60"
              >
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Vertical Filter</label>
                  <div className="flex gap-2 flex-wrap">
                    {(['all', 'inward', 'outward', 'orders', 'essential-docs'] as FilterType[]).map(t => (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all",
                          typeFilter === t ? "bg-cyber-violet text-white shadow-lg shadow-cyber-violet/20" : "bg-white border border-slate-100 text-slate-400 hover:bg-slate-50"
                        )}
                      >
                        {t === 'essential-docs' ? 'Assets' : t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Scan Origin</label>
                  <input
                    type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/60 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet transition-all text-sm font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Scan Horizon</label>
                  <input
                    type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/60 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet transition-all text-sm font-bold text-slate-800"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Strategic Project</label>
                  <ComboBox 
                    value={projectFilter}
                    onChange={(val) => setProjectFilter(val)}
                    options={allProjects}
                    placeholder="All Segments"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Data Stream */}
        <div className="divide-y divide-slate-100/50">
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="w-20 h-20 rounded-[30px] bg-slate-50 flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-slate-200" />
                </div>
                <h4 className="text-xl font-black text-slate-700 tracking-tight">Zero Matches</h4>
                <p className="text-sm text-slate-400 font-bold max-w-xs mt-2 leading-relaxed">The current filter matrix yields no detectable records. Adjust parameters.</p>
              </motion.div>
            ) : (
              filtered.map((item, idx) => (
                <motion.div
                  key={item.id ?? idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-6 px-8 py-6 hover:bg-cyber-violet/[0.02] transition-colors group relative"
                >
                  {/* Type Indicator */}
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-all group-hover:scale-110",
                    item.type === 'inward' ? "bg-blue-50 text-blue-500 border-blue-100" : 
                    item.type === 'outward' ? "bg-emerald-50 text-emerald-500 border-emerald-100" : 
                    item.type === 'orders' ? "bg-amber-50 text-amber-500 border-amber-100" : 
                    "bg-cyber-violet/5 text-cyber-violet border-cyber-violet/10"
                  )}>
                    {typeStyles[item.type]?.icon}
                  </div>

                  {/* Core Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                        typeStyles[item.type]?.badge
                      )}>
                        {typeStyles[item.type]?.label} Record
                      </span>
                      <span className="text-[10px] font-bold text-slate-300 font-mono tracking-tight group-hover:text-cyber-violet transition-colors">
                        UID: {item.id.slice(-6)}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-800 truncate group-hover:text-cyber-violet transition-colors">
                      {item.subject || "Undefined Context"}
                    </h4>
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-slate-400">
                      <span className="flex items-center gap-1.5 min-w-[120px]">
                        <LayoutGrid className="w-3.5 h-3.5" />
                        {item.type === 'orders' ? (item.project || 'Global') : item.partyName.replace(/\|\|\|/g, ', ')}
                      </span>
                      {item.referenceNumber && (
                        <>
                          <span className="text-slate-200">/</span>
                          <span className="font-mono tracking-tighter text-slate-500">{item.referenceNumber}</span>
                        </>
                      )}
                      {item.project && item.type !== 'orders' && (
                        <>
                          <span className="text-slate-200">/</span>
                          <span className="text-cyber-violet/70">{item.project}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Date + Action Container */}
                  <div className="flex items-center gap-6 shrink-0 ml-auto pt-2 sm:pt-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-black text-slate-800 tracking-tight leading-none mb-1">{item.date}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Registered At</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05, x: 4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedEntry(item)}
                      className="px-5 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-cyber-violet hover:border-cyber-violet/40 hover:shadow-lg transition-all flex items-center gap-2 group/btn"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">Detail</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
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
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8 }}
      className="group relative h-full"
    >
      {/* Background Glow */}
      <div className={cn("absolute inset-0 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br rounded-3xl", styles)} />
      
      <div className="relative h-full glass-card p-6 rounded-[32px] border-white/60 shadow-glass flex flex-col items-center text-center">
        <div className={cn("w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 border border-slate-50 transition-transform group-hover:scale-110", styles)}>
          <div className="w-6 h-6">{icon}</div>
        </div>
        
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</p>
        <h3 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-3">
          {value}
        </h3>
        
        <div className="mt-auto pt-4 border-t border-slate-50 w-full">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}
