import { useState } from 'react';
import { Loader2, Search, AlertOctagon, Maximize2, Pencil, Trash2 } from 'lucide-react';
import type { RegisterEntry } from '../types';
import DocumentModal from './DocumentModal';
import EditModal from './EditModal';
import { deleteRegisterEntry } from '../lib/dataService';

interface Props {
  data: RegisterEntry[];
  loading: boolean;
  projects: string[];
  onRefresh: () => void;
}

export default function OrdersTable({ data, loading, projects, onRefresh }: Props) {
  const [search, setSearch] = useState('');
  const [viewEntry, setViewEntry] = useState<RegisterEntry | null>(null);
  const [editEntry, setEditEntry] = useState<RegisterEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegisterEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredData = data.filter(item =>
    item.subject.toLowerCase().includes(search.toLowerCase()) ||
    (item.project ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (item.remarks ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await deleteRegisterEntry(deleteTarget.id, 'orders');
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
            <AlertOctagon className="w-4 h-4 text-amber-500" />
            Important Orders Log
            <span className="text-xs font-medium text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-full">{filteredData.length}</span>
          </h3>
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            <p className="text-sm font-medium text-slate-500">Fetching from Dropbox...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="p-3.5 rounded-full bg-slate-50 border border-slate-100"><AlertOctagon className="w-7 h-7 text-slate-300" /></div>
            <p className="font-medium text-slate-500 text-sm">No Important Orders found.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    <th className="px-5 py-3 whitespace-nowrap">Date</th>
                    <th className="px-5 py-3 whitespace-nowrap">RajKaj Ref.</th>
                    <th className="px-5 py-3 whitespace-nowrap">Project</th>
                    <th className="px-5 py-3 min-w-[180px]">Subject</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap text-xs">{row.date}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{row.remarks || '—'}</td>
                      <td className="px-5 py-3.5 text-amber-700 font-medium text-xs">{row.project || '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[180px] truncate" title={row.subject}>{row.subject}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <ActionBtn icon={<Maximize2 className="w-3 h-3" />} label="View" onClick={() => setViewEntry(row)} color="slate" />
                          <ActionBtn icon={<Pencil className="w-3 h-3" />} label="Edit" onClick={() => setEditEntry(row)} color="amber" />
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
                    <p className="font-semibold text-slate-800 text-sm truncate flex-1">{row.subject || '—'}</p>
                    <div className="flex gap-1 flex-shrink-0">
                      <MobileIconBtn icon={<Maximize2 className="w-3.5 h-3.5" />} onClick={() => setViewEntry(row)} color="slate" />
                      <MobileIconBtn icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setEditEntry(row)} color="amber" />
                      <MobileIconBtn icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteTarget(row)} color="red" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="text-[11px] text-slate-400"><span className="font-medium text-slate-500">Date:</span> {row.date}</span>
                    {row.project && <span className="text-[11px] text-amber-600 font-semibold">{row.project}</span>}
                    {row.remarks && <span className="text-[11px] text-slate-400"><span className="font-medium">RajKaj:</span> {row.remarks}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {viewEntry && <DocumentModal entry={viewEntry} onClose={() => setViewEntry(null)} />}
      {editEntry && (
        <EditModal
          entry={editEntry} departments={[]} projects={projects}
          onClose={() => setEditEntry(null)}
          onSuccess={() => { setEditEntry(null); onRefresh(); }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-1">Delete Order?</h3>
            <p className="text-sm text-slate-500 text-center mb-5">
              <span className="font-medium text-slate-700">"{deleteTarget.subject}"</span> will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-60">
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
    amber: 'hover:bg-amber-50 hover:text-amber-600 text-slate-400',
    red: 'hover:bg-red-50 hover:text-red-600 text-slate-400',
  };
  return (
    <button onClick={onClick} title={label} className={`p-1.5 rounded-lg transition-all ${colors[color]}`}>{icon}</button>
  );
}

function MobileIconBtn({ icon, onClick, color }: { icon: React.ReactNode; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-500',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-500',
  };
  return <button onClick={onClick} className={`p-2 rounded-lg ${colors[color]}`}>{icon}</button>;
}
