import { useState, memo } from 'react';
import { Loader2, Search, FileText, Maximize2, Pencil, Trash2, ArrowUpDown, FileSpreadsheet, FileDown, MessageSquare } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import type { RegisterEntry } from '../types';
import { formatDate } from '../utils/dateUtils';
import DocumentModal from './DocumentModal';
import EditModal from './EditModal';
import ShareWhatsAppModal from './ShareWhatsAppModal';
import { deleteRegisterEntry } from '../lib/dataService';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useDebounce } from '../hooks/useDebounce';

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
  staffData?: RegisterEntry[];
}

const DataTable = memo(function DataTable({ data, type, loading, departments, projects, onRefresh, staffData = [] }: Props) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [viewEntry, setViewEntry] = useState<RegisterEntry | null>(null);
  const [editEntry, setEditEntry] = useState<RegisterEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegisterEntry | null>(null);
  const [shareEntry, setShareEntry] = useState<RegisterEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'subject-asc' | 'subject-desc' | 'party-asc' | 'party-desc' | 'dispatch-asc' | 'dispatch-desc'>(type === 'outward' ? 'dispatch-desc' : 'date-desc');

  const filteredData = data.filter(item =>
    item.subject.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    item.partyName.replace(/\|\|\|/g, ' ').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    item.referenceNumber.toLowerCase().includes(debouncedSearch.toLowerCase())
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
      <div className="border border-rule overflow-hidden flex flex-col">
        <div className="p-5 sm:p-6 border-b border-rule flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-panel">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-ink/5 text-accent">
              <FileText />
            </div>
            <div>
              <h3 className="text-lg font-serif-display text-ink tracking-tight leading-none capitalize">
                {type} Registry
              </h3>
              <p className="font-mono text-[10px] text-muted tracking-[0.18em] uppercase mt-1.5 flex items-center gap-2">
                Live Data <span className="w-1 h-1 rounded-full bg-good" />
              </p>
            </div>
            <span className="ml-2 font-mono text-[10px] text-accent bg-accent/5 px-2 py-0.5 rounded-full border border-accent/10">
              {filteredData.length} Records
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72 group">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-ink transition-colors" />
              <input
                type="text"
                placeholder={`Search ${type}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-rule bg-panel text-xs focus:border-ink outline-none transition-all placeholder:text-muted font-serif-body text-ink"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {type === 'outward' && (
                <div className="relative flex-1 sm:flex-none">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="w-full pl-4 pr-10 py-2.5 border border-rule bg-panel font-mono text-[10px] text-muted tracking-[0.18em] uppercase focus:border-ink outline-none transition-all appearance-none cursor-pointer hover:bg-paper"
                  >
                    <option value="subject-asc">A to Z</option>
                    <option value="dispatch-desc">Dispatch High</option>
                  </select>
                  <ArrowUpDown className="w-3 h-3 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                </div>
              )}

              <div className="flex items-center gap-2 ml-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => exportToExcel(filteredData, `${type}_registry`)}
                  title="Export to Excel"
                  className="p-2.5 border border-rule text-muted hover:text-ink hover:border-ink transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => exportToPDF(filteredData, `${type.toUpperCase()} Registry Report`, `${type}_report`)}
                  title="Export to PDF"
                  className="p-2.5 border border-rule text-muted hover:text-bad hover:border-bad transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-ink" />
            <p className="font-mono text-xs text-muted uppercase tracking-[0.18em]">Syncing Records</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-20 h-20 bg-panel flex items-center justify-center border border-rule">
              <FileText className="w-10 h-10 text-muted" />
            </div>
            <div className="text-muted">
              <p className="font-serif-display text-ink tracking-tight">Vault Empty</p>
              <p className="text-xs text-muted mt-1 font-serif-body">No results match your current parameters.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-panel/40 border-b border-rule font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Ref.</th>
                    <th className="px-6 py-4">{type === 'inward' ? 'Sender' : 'Recipient'}</th>
                    <th className="px-6 py-4">Project</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/50">
                  <AnimatePresence>
                    {filteredData.map((row) => (
                      <tr 
                        key={row.id}
                        className="transition-colors group cursor-default hover:bg-panel/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-serif-body text-muted">{formatDate(row.date)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-[10px] text-muted bg-panel px-2 py-0.5 border border-rule">
                            {row.referenceNumber || row.remarks || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-serif-display text-ink truncate max-w-[150px]">
                            {row.partyName.replace(/\|\|\|/g, ', ')}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {row.project ? (
                            <span className="font-mono text-[10px] text-accent bg-accent/5 px-2 py-0.5 border border-accent/10">
                              {row.project}
                            </span>
                          ) : <span className="text-muted/30">——</span>}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-serif-body text-muted truncate max-w-[200px]" title={row.subject}>
                            {row.subject}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                            <ActionBtn id={`view-${row.id}`} icon={<Maximize2 className="w-3.5 h-3.5" />} label="Quick View" onClick={() => setViewEntry(row)} color="slate" />
                            <ActionBtn id={`share-${row.id}`} icon={<MessageSquare className="w-3.5 h-3.5" />} label="Share Alert" onClick={() => setShareEntry(row)} color="teal" />
                            <ActionBtn id={`edit-${row.id}`} icon={<Pencil className="w-3.5 h-3.5" />} label="Modify" onClick={() => setEditEntry(row)} color="violet" />
                            <ActionBtn id={`delete-${row.id}`} icon={<Trash2 className="w-3.5 h-3.5" />} label="Archive" onClick={() => setDeleteTarget(row)} color="red" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-rule">
              {filteredData.map(row => (
                <div key={row.id} className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-serif-body text-ink text-sm truncate">{row.subject || '—'}</p>
                      <p className="text-xs text-muted mt-0.5 truncate">{row.partyName.replace(/\|\|\|/g, ', ')}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <MobileIconBtn id={`view-mob-${row.id}`} icon={<Maximize2 className="w-3.5 h-3.5" />} onClick={() => setViewEntry(row)} color="slate" />
                      <MobileIconBtn id={`share-mob-${row.id}`} icon={<MessageSquare className="w-3.5 h-3.5" />} onClick={() => setShareEntry(row)} color="teal" />
                      <MobileIconBtn id={`edit-mob-${row.id}`} icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setEditEntry(row)} color="indigo" />
                      <MobileIconBtn id={`delete-mob-${row.id}`} icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDeleteTarget(row)} color="red" />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <span className="font-mono text-[11px] text-muted">Date: {formatDate(row.date)}</span>
                    {row.referenceNumber && <span className="font-mono text-[11px] text-muted">Dispatch: {row.referenceNumber}</span>}
                    {row.project && <span className="font-mono text-[11px] text-accent">{row.project}</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {viewEntry && <DocumentModal entry={viewEntry} onClose={() => setViewEntry(null)} />}
      {shareEntry && (
        <ShareWhatsAppModal
          entry={shareEntry}
          type={type}
          staffData={staffData}
          onClose={() => setShareEntry(null)}
        />
      )}
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
          <div className="absolute inset-0 bg-ink/20" onClick={() => setDeleteTarget(null)} />
          <div className="relative z-10 bg-paper border border-rule p-6 w-full max-w-sm">
            <div className="w-12 h-12 rounded-full bg-bad/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-bad" />
            </div>
            <h3 className="text-lg font-serif-display text-ink text-center mb-1">Delete Entry?</h3>
            <p className="text-sm text-muted text-center mb-5">
              <span className="font-serif-body text-ink">"{deleteTarget.subject}"</span> will be permanently removed from Dropbox.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-rule text-muted font-serif-body text-sm hover:bg-panel">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 py-2.5 bg-bad text-white font-serif-body text-sm hover:bg-bad/80 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default DataTable;

function ActionBtn({ id, icon, label, onClick, color }: { id: string; icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; color: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-panel text-muted hover:text-ink hover:border-ink',
    violet: 'bg-accent/10 text-accent hover:bg-accent/20',
    indigo: 'border border-rule text-muted hover:text-accent hover:border-accent',
    red: 'border border-rule text-muted hover:text-bad hover:border-bad',
    teal: 'bg-good/10 text-good hover:bg-good/20 border-good/20 hover:border-good',
  };
  return (
    <motion.button
      id={id} onClick={onClick} title={label}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn("p-2 transition-all border border-rule", colors[color])}
    >
      {icon}
    </motion.button>
  );
}

function MobileIconBtn({ id, icon, onClick, color }: { id: string; icon: React.ReactNode; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-panel/5 text-muted',
    indigo: 'bg-accent/5 text-accent',
    red: 'bg-bad/5 text-bad',
    teal: 'bg-good/5 text-good',
  };
  return (
    <motion.button
      id={id} onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className={cn("p-2 transition-all border border-rule", colors[color])}
    >
      {icon}
    </motion.button>
  );
}
