import { useState } from 'react';
import { Loader2, Search, FileText, Maximize2, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import type { RegisterEntry } from '../types';
import DocumentModal from './DocumentModal';
import EditModal from './EditModal';
import { deleteRegisterEntry } from '../lib/dataService';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  data: RegisterEntry[];
  type: 'inward' | 'outward';
  loading: boolean;
  departments: string[];
  projects: string[];
  onRefresh: () => void;
}

export default function DataTable({ data, type, loading, departments, projects, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [viewEntry, setViewEntry] = useState<RegisterEntry | null>(null);
  const [editEntry, setEditEntry] = useState<RegisterEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegisterEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'subject-asc' | 'subject-desc' | 'party-asc' | 'party-desc' | 'dispatch-asc' | 'dispatch-desc'>(type === 'outward' ? 'dispatch-desc' : 'date-desc');

  const filteredData = data.filter(item =>
    item.subject.toLowerCase().includes(search.toLowerCase()) ||
    item.partyName.replace(/\|\|\|/g, ' ').toLowerCase().includes(search.toLowerCase()) ||
    item.referenceNumber.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    switch (sortBy) {
      case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'subject-asc': return a.subject.localeCompare(b.subject);
      case 'subject-desc': return b.subject.localeCompare(a.subject);
      case 'party-asc': return a.partyName.localeCompare(b.partyName);
      case 'party-desc': return b.partyName.localeCompare(a.partyName);
      case 'dispatch-asc': return (a.referenceNumber || '').localeCompare(b.referenceNumber || '');
      case 'dispatch-desc': return (b.referenceNumber || '').localeCompare(a.referenceNumber || '');
      default: return 0;
    }
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await deleteRegisterEntry(deleteTarget.id, type);
    setDeleteTarget(null);
    setDeleteLoading(false);
    onRefresh();
  };

  return (
    <>
      <div className="glass-card rounded-[32px] overflow-hidden flex flex-col border-white/40 shadow-glass">
        {/* Header / Search Area */}
        <div className="p-5 sm:p-6 border-b border-slate-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyber-violet/5 text-cyber-violet">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight leading-none capitalize">
                {type} Registry
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                Live Data <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              </p>
            </div>
            <span className="ml-2 text-[10px] font-black text-cyber-violet bg-cyber-violet/5 px-2 py-0.5 rounded-full border border-cyber-violet/10">
              {filteredData.length} Records
            </span>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72 group">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyber-violet transition-colors" />
              <input 
                type="text" 
                placeholder={`Search ${type}...`} 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-[18px] bg-white/50 text-sm focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet focus:bg-white outline-none transition-all placeholder:text-slate-400 font-medium" 
              />
            </div>
            
            {type === 'outward' && (
              <div className="relative">
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="pl-4 pr-10 py-2.5 border border-slate-200 rounded-[18px] bg-white/50 text-xs font-bold text-slate-600 focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet outline-none transition-all appearance-none cursor-pointer hover:bg-white"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="subject-asc">A to Z</option>
                  <option value="dispatch-desc">Dispatch High</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 animate-pulse">
            <div className="relative">
              <div className="absolute inset-0 bg-cyber-violet/20 blur-xl rounded-full" />
              <Loader2 className="w-8 h-8 animate-spin text-cyber-violet relative z-10" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Syncing Records</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center border border-slate-100">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="font-extrabold text-slate-800 tracking-tight">Vault Empty</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">No results match your current parameters.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-[0.15em] text-slate-400 font-black">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Ref.</th>
                    <th className="px-6 py-4">{type === 'inward' ? 'Sender' : 'Recipient'}</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  <AnimatePresence>
                    {filteredData.map((row, idx) => (
                      <motion.tr 
                        key={row.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        whileHover={{ backgroundColor: "rgba(124, 58, 237, 0.02)", x: 4 }}
                        className="transition-colors group cursor-default"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-500">{row.date}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-[10px] font-black font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                            {row.referenceNumber || row.remarks || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-extrabold text-slate-800 truncate max-w-[150px]">
                            {row.partyName.replace(/\|\|\|/g, ', ')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {row.project ? (
                            <span className="text-[10px] font-black text-cyber-violet bg-cyber-violet/5 px-2 py-0.5 rounded-lg border border-cyber-violet/10">
                              {row.project}
                            </span>
                          ) : <span className="text-slate-300">——</span>}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-600 truncate max-w-[200px]" title={row.subject}>
                            {row.subject}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                            <ActionBtn id={`view-${row.id}`} icon={<Maximize2 className="w-3.5 h-3.5" />} label="Quick View" onClick={() => setViewEntry(row)} color="slate" />
                            <ActionBtn id={`edit-${row.id}`} icon={<Pencil className="w-3.5 h-3.5" />} label="Modify" onClick={() => setEditEntry(row)} color="violet" />
                            <ActionBtn id={`delete-${row.id}`} icon={<Trash2 className="w-3.5 h-3.5" />} label="Archive" onClick={() => setDeleteTarget(row)} color="red" />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-50">
              {filteredData.map(row => (
                <div key={row.id} className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{row.subject || '—'}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{row.partyName.replace(/\|\|\|/g, ', ')}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <MobileIconBtn id={`view-mob-${row.id}`} icon={<Maximize2 className="w-3.5 h-3.5" />} onClick={() => setViewEntry(row)} color="slate" />
                      <MobileIconBtn id={`edit-mob-${row.id}`} icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setEditEntry(row)} color="indigo" />
                      <MobileIconBtn id={`delete-mob-${row.id}`} icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteTarget(row)} color="red" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-[11px] text-slate-400"><span className="font-medium text-slate-500">Date:</span> {row.date}</span>
                    {row.referenceNumber && <span className="text-[11px] text-slate-400"><span className="font-medium">Dispatch:</span> {row.referenceNumber}</span>}
                    {row.project && <span className="text-[11px] text-indigo-500 font-semibold">{row.project}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {viewEntry && <DocumentModal entry={viewEntry} onClose={() => setViewEntry(null)} />}
      {editEntry && (
        <EditModal
          entry={editEntry} departments={departments} projects={projects}
          onClose={() => setEditEntry(null)}
          onSuccess={() => { setEditEntry(null); onRefresh(); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-1">Delete Entry?</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              <span className="font-medium text-slate-700">"{deleteTarget.subject}"</span> will be permanently removed from Dropbox.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActionBtn({ id, icon, label, onClick, color }: { id: string; icon: React.ReactNode; label: string; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-500 hover:bg-slate-200',
    violet: 'bg-cyber-violet/10 text-cyber-violet hover:bg-cyber-violet/20',
    red: 'bg-red-50 text-red-500 hover:bg-red-100',
  };
  return (
    <motion.button 
      id={id} onClick={onClick} title={label} 
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn("p-2 rounded-xl transition-all shadow-sm", colors[color])}
    >
      {icon}
    </motion.button>
  );
}

function MobileIconBtn({ id, icon, onClick, color }: { id: string; icon: React.ReactNode; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-500',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-500',
  };
  return (
    <button id={id} onClick={onClick} aria-label="Action button" className={`p-2 rounded-lg ${colors[color]}`}>{icon}</button>
  );
}
