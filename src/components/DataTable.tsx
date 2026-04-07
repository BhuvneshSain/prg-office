import { useState } from 'react';
import { Loader2, Search, FileText, Maximize2, Pencil, Trash2, ArrowUpDown } from 'lucide-react';
import type { RegisterEntry } from '../types';
import DocumentModal from './DocumentModal';
import EditModal from './EditModal';
import { deleteRegisterEntry } from '../lib/dropbox';

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
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            {type === 'inward' ? 'Inward' : 'Outward'} Logs
            <span className="text-xs font-medium text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-full">{filteredData.length}</span>
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400" />
            </div>
            {type === 'outward' && (
              <div className="relative">
                <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value as any)}
                  className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer text-slate-600 font-medium"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="subject-asc">Subject (A-Z)</option>
                  <option value="subject-desc">Subject (Z-A)</option>
                  <option value="party-asc">Recipient (A-Z)</option>
                  <option value="party-desc">Recipient (Z-A)</option>
                  <option value="dispatch-asc">Dispatch No. (0-9)</option>
                  <option value="dispatch-desc">Dispatch No. (9-0)</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
            <p className="text-sm font-medium text-slate-500">Fetching from Dropbox...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="p-3.5 rounded-full bg-slate-50 border border-slate-100"><FileText className="w-7 h-7 text-slate-300" /></div>
            <p className="font-medium text-slate-500 text-sm">No {type} records found.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    <th className="px-5 py-3 whitespace-nowrap">Date</th>
                    <th className="px-5 py-3 whitespace-nowrap">Dispatch No.</th>
                    <th className="px-5 py-3 whitespace-nowrap">RajKaj Ref.</th>
                    <th className="px-5 py-3 whitespace-nowrap">{type === 'inward' ? 'Sender Dept' : 'Recipient Dept'}</th>
                    <th className="px-5 py-3 whitespace-nowrap">Project</th>
                    <th className="px-5 py-3 min-w-[160px]">Subject</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap text-xs">{row.date}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{row.referenceNumber || '—'}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{row.remarks || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium text-xs max-w-[140px] truncate" title={row.partyName.replace(/\|\|\|/g, ', ')}>{row.partyName.replace(/\|\|\|/g, ', ')}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs max-w-[100px] truncate">{row.project || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[160px] truncate" title={row.subject}>{row.subject}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <ActionBtn icon={<Maximize2 className="w-3 h-3" />} label="View" onClick={() => setViewEntry(row)} color="slate" />
                          <ActionBtn icon={<Pencil className="w-3 h-3" />} label="Edit" onClick={() => setEditEntry(row)} color="indigo" />
                          <ActionBtn icon={<Trash2 className="w-3 h-3" />} label="Delete" onClick={() => setDeleteTarget(row)} color="red" />
                        </div>
                      </td>
                    </tr>
                  ))}
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
                      <MobileIconBtn icon={<Maximize2 className="w-3.5 h-3.5" />} onClick={() => setViewEntry(row)} color="slate" />
                      <MobileIconBtn icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setEditEntry(row)} color="indigo" />
                      <MobileIconBtn icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteTarget(row)} color="red" />
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

function ActionBtn({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    slate: 'hover:bg-slate-100 hover:text-slate-700 text-slate-400',
    indigo: 'hover:bg-indigo-50 hover:text-indigo-600 text-slate-400',
    red: 'hover:bg-red-50 hover:text-red-600 text-slate-400',
  };
  return (
    <button onClick={onClick} title={label} className={`p-1.5 rounded-lg transition-all ${colors[color]}`}>
      {icon}
    </button>
  );
}

function MobileIconBtn({ icon, onClick, color }: { icon: React.ReactNode; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-500',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-500',
  };
  return (
    <button onClick={onClick} className={`p-2 rounded-lg ${colors[color]}`}>{icon}</button>
  );
}
