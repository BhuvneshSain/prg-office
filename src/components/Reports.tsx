import { useState, useMemo } from 'react';
import type { RegisterEntry } from '../types';
import { BarChart3, TrendingUp, Calendar, Hash, AlertOctagon, Search, Filter, Maximize2, X, ChevronDown } from 'lucide-react';
import DocumentModal from './DocumentModal';

type FilterType = 'all' | 'inward' | 'outward' | 'orders';

export default function Reports({
  inward, outward, orders
}: {
  inward: RegisterEntry[],
  outward: RegisterEntry[],
  orders: RegisterEntry[]
}) {
  const allEntries = useMemo(() => [...inward, ...outward, ...orders], [inward, outward, orders]);

  // Stat totals
  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalInward = inward.length;
  const totalOutward = outward.length;
  const totalOrders = orders.length;
  const totalDocs = totalInward + totalOutward + totalOrders;
  const thisMonthInward = inward.filter(i => i.date.startsWith(currentMonth)).length;
  const thisMonthOutward = outward.filter(o => o.date.startsWith(currentMonth)).length;
  const thisMonthOrders = orders.filter(o => o.date.startsWith(currentMonth)).length;

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

  const typeColors: Record<string, string> = {
    inward: 'bg-blue-100 text-blue-700',
    outward: 'bg-emerald-100 text-emerald-700',
    orders: 'bg-amber-100 text-amber-700'
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 bg-indigo-100 rounded-xl">
          <BarChart3 className="w-6 h-6 text-indigo-700" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Analytics & Reports</h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Documents" value={totalDocs} icon={<Hash className="w-6 h-6 text-indigo-500" />} subtitle="All time records" colorClass="bg-indigo-50/50 border-indigo-100/60" />
        <StatCard title="Inward Received" value={totalInward} icon={<TrendingUp className="w-6 h-6 text-blue-500 translate-y-0.5" />} subtitle={`${thisMonthInward} this month`} colorClass="bg-blue-50/50 border-blue-100/60" />
        <StatCard title="Outward Dispatched" value={totalOutward} icon={<TrendingUp className="w-6 h-6 text-emerald-500 -translate-y-0.5 scale-y-[-1]" />} subtitle={`${thisMonthOutward} this month`} colorClass="bg-emerald-50/50 border-emerald-100/60" />
        <StatCard title="Important Orders" value={totalOrders} icon={<AlertOctagon className="w-6 h-6 text-amber-500" />} subtitle={`${thisMonthOrders} this month`} colorClass="bg-amber-50/50 border-amber-100/60" />
      </div>

      {/* Activity Log with Filters */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-sm rounded-3xl overflow-hidden">

        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              Activity Log
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filtered.length} of {totalDocs}</span>
            </h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text" placeholder="Search entries..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-sm font-medium transition-all ${showFilters || hasActiveFilters ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-white/60 inline-block" />}
              </button>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                  <X className="w-4 h-4" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Expanded Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Type Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</label>
                <div className="flex gap-1 flex-wrap">
                  {(['all', 'inward', 'outward', 'orders'] as FilterType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${typeFilter === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Date From */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From Date</label>
                <input
                  type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* Date To */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To Date</label>
                <input
                  type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              {/* Project Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</label>
                <div className="relative">
                  <select
                    value={projectFilter}
                    onChange={e => setProjectFilter(e.target.value)}
                    className="w-full appearance-none px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all pr-8"
                  >
                    <option value="">All Projects</option>
                    {allProjects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Entry List */}
        <div className="divide-y divide-slate-50">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <div className="p-4 rounded-full bg-slate-50 border border-slate-100">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-medium">No entries match your filters.</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-indigo-600 hover:underline">Clear all filters</button>
              )}
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.id ?? idx}
                className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/80 transition-colors group"
              >
                {/* Type Icon */}
                <div className={`mt-0.5 p-2 rounded-full flex-shrink-0 ${item.type === 'inward' ? 'bg-blue-100 text-blue-600' : item.type === 'orders' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {item.type === 'inward' ? <TrendingUp className="w-4 h-4" /> : item.type === 'orders' ? <AlertOctagon className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 scale-y-[-1]" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${typeColors[item.type]}`}>{item.type}</span>
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.subject || <span className="italic text-slate-400">No Subject</span>}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    <span className="font-medium">{item.type === 'inward' ? 'From: ' : item.type === 'orders' ? 'Project: ' : 'To: '}</span>
                    {item.type === 'orders' ? (item.project || 'None') : item.partyName.replace(/\|\|\|/g, ', ')}
                    {item.referenceNumber && <><span className="mx-2">•</span><span className="font-mono">{item.referenceNumber}</span></>}
                    {item.project && item.type !== 'orders' && <><span className="mx-2">•</span><span className="text-indigo-500">{item.project}</span></>}
                  </p>
                </div>

                {/* Date + View */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-400 font-medium hidden sm:block">{item.date}</span>
                  <button
                    onClick={() => setSelectedEntry(item)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm opacity-0 group-hover:opacity-100"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Document Modal */}
      {selectedEntry && <DocumentModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />}
    </div>
  );
}

function StatCard({ title, value, icon, subtitle, colorClass }: any) {
  return (
    <div className={`p-6 rounded-3xl border ${colorClass} bg-white backdrop-blur-sm shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-black/5">
          {icon}
        </div>
      </div>
      <h4 className="text-slate-500 font-medium text-sm tracking-wide">{title}</h4>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-800 tracking-tight">{value}</span>
      </div>
      <p className="text-xs text-slate-400 font-medium mt-3 bg-white/60 inline-block px-2 py-1 rounded-md">{subtitle}</p>
    </div>
  );
}
