import { useState, memo } from 'react';
import { Search, Users, Pencil, Trash2, FileSpreadsheet, FileDown, Phone, GripVertical, UserX, AlertCircle } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteRegisterEntry, saveRegisterData } from '../lib/dataService';
import StaffEditModal from './StaffEditModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useDebounce } from '../hooks/useDebounce';

import type { RegisterEntry } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SEP = '|||';

interface StaffTableProps {
  data: RegisterEntry[];
  loading?: boolean;
  projects: string[];
  posts: string[];
  onRefresh: () => void;
}

const StaffTable = memo(function StaffTable({ data, projects, posts, onRefresh }: StaffTableProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [editEntry, setEditEntry] = useState<RegisterEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegisterEntry | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filtered = data.filter((s: RegisterEntry) =>
    s.partyName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    s.subject.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (s.mobile ?? '').includes(debouncedSearch) ||
    (s.project ?? '').toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteRegisterEntry(deleteTarget.id, 'staff');
      setDeleteTarget(null);
      onRefresh();
    }
  };

  const onDragEnd = async (result: { destination?: { index: number } | null; source: { index: number } }) => {
    if (!result.destination || search) return;

    const items: RegisterEntry[] = Array.from(data);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const ok = await saveRegisterData('staff', items);
    if (ok) onRefresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border border-rule overflow-hidden"
    >
      <div className="p-5 sm:p-6 border-b border-rule flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-panel">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-serif-display flex items-center gap-2 text-ink">
            <Users className="w-5 h-5 text-accent" /> Personnel Directory
          </h3>
          <div className="flex items-center gap-4 mt-1">
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-accent" /> Active Service Records
            </p>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportToExcel(data, 'staff_directory')}
                title="Export to Excel"
                className="p-2.5 text-good border border-rule hover:bg-panel transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportToPDF(data, 'Staff Directory Report', 'staff_report')}
                title="Export to PDF"
                className="p-2.5 text-bad border border-rule hover:bg-panel transition-colors"
              >
                <FileDown className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="relative group w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            placeholder="Search personnel..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-rule bg-paper text-sm focus:border-ink outline-none transition-all placeholder:text-muted font-serif-body text-ink"
          />
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <DragDropContext onDragEnd={onDragEnd}>
          <table className="w-full text-left border-collapse hidden sm:table">
            <thead>
              <tr className="bg-panel text-muted font-mono text-[11px] tracking-[0.18em] uppercase border-b border-rule">
                {!search && <th className="w-14 px-4 py-4 text-center">Ord</th>}
                <th className="px-6 py-4">Operator</th>
                <th className="px-6 py-4">Identifier</th>
                <th className="px-6 py-4">Deployment</th>
                <th className="px-6 py-4">Terminal</th>
                <th className="px-6 py-4">Assignments</th>
                <th className="px-6 py-4 text-center">Auth</th>
              </tr>
            </thead>
            <Droppable droppableId="staff-list">
              {(provided) => (
                <tbody {...provided.droppableProps} ref={provided.innerRef} className="relative">
                    {filtered.map((row: RegisterEntry, index: number) => (
                      <Draggable key={row.id} draggableId={row.id} index={index} isDragDisabled={!!search}>
                        {(provided, snapshot) => (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onMouseEnter={() => setHoveredRow(row.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "relative group transition-all duration-300 border-b border-rule",
                              snapshot.isDragging ? "z-50 scale-[1.02] bg-paper border-accent/20" : "bg-transparent"
                            )}
                            style={provided.draggableProps.style}
                          >
                            {/* Hover Highlight */}
                            {hoveredRow === row.id && !snapshot.isDragging && (
                              <td
                                className="absolute inset-x-2 inset-y-1.5 bg-accent/[0.03] -z-10 pointer-events-none border border-accent/5"
                              />
                            )}

                            {!search && (
                              <td className="px-4 py-4 text-center align-middle" {...provided.dragHandleProps}>
                                <div className="p-1 hover:bg-paper transition-all inline-block group-hover:text-accent text-muted">
                                  <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing" />
                                </div>
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-accent/5 flex items-center justify-center border border-accent/10 font-serif-display text-accent text-[10px]">
                                  {row.partyName.split(' ')[0][0]}{row.partyName.split(' ').length > 1 ? row.partyName.split(' ')[1][0] : ''}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-serif-body text-ink leading-none">{row.partyName}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[11px] font-mono text-muted bg-panel px-2 py-1">
                                {row.referenceNumber || 'HIDDEN'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-accent/5 text-accent px-3 py-1.5 font-mono text-[11px] tracking-[0.18em] uppercase border border-accent/10">
                                {row.subject}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {row.mobile ? (
                                <a href={`tel:${row.mobile}`} className="flex items-center gap-2 text-xs font-serif-body text-accent hover:underline decoration-accent/30">
                                  <Phone className="w-3 h-3" /> {row.mobile}
                                </a>
                              ) : <span className="text-muted text-xs">&mdash;</span>}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {(row.project ?? '').split(SEP).filter(Boolean).map((p: string) => (
                                  <motion.span
                                    whileHover={{ scale: 1.05 }}
                                    key={p}
                                    className="bg-paper border border-rule text-ink px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] uppercase flex items-center gap-1.5"
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" /> {p}
                                  </motion.span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                <ActionBtn id={`edit-${row.id}`} icon={<Pencil className="w-4 h-4" />} label="Modify" onClick={() => setEditEntry(row)} color="accent" />
                                <ActionBtn id={`delete-${row.id}`} icon={<Trash2 className="w-4 h-4" />} label="Archive" onClick={() => setDeleteTarget(row)} color="bad" />
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </table>
        </DragDropContext>

        {/* Mobile View */}
        <div className="sm:hidden divide-y divide-rule">
          {filtered.map((row: RegisterEntry) => (
            <div key={row.id} className="p-4">
              <div className="flex justify-between items-start gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-accent/5 flex items-center justify-center border border-accent/10 font-serif-display text-accent text-xs shrink-0">
                    {row.partyName.split(' ')[0][0]}{row.partyName.split(' ').length > 1 ? row.partyName.split(' ')[1][0] : ''}
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif-display text-ink text-sm truncate">{row.partyName}</p>
                    <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent mt-0.5">{row.subject}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <ActionBtn id={`edit-mob-${row.id}`} icon={<Pencil className="w-3.5 h-3.5" />} label="Modify" onClick={() => setEditEntry(row)} color="accent" />
                  <ActionBtn id={`delete-mob-${row.id}`} icon={<Trash2 className="w-3.5 h-3.5" />} label="Archive" onClick={() => setDeleteTarget(row)} color="bad" />
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 ml-[52px]">
                {row.mobile && (
                  <a href={`tel:${row.mobile}`} className="flex items-center gap-1.5 text-[11px] font-serif-body text-accent">
                    <Phone className="w-3 h-3" /> {row.mobile}
                  </a>
                )}
                <span className="text-[11px] text-muted font-mono">{row.referenceNumber || 'ID: HIDDEN'}</span>
              </div>

              {(row.project ?? '').split(SEP).filter(Boolean).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 ml-[52px]">
                  {(row.project ?? '').split(SEP).filter(Boolean).map((p: string) => (
                    <span key={p} className="bg-panel font-mono text-[9px] tracking-[0.18em] uppercase px-2 py-0.5 border border-rule text-muted">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>


      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="p-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-panel flex items-center justify-center mb-6">
            <UserX className="w-10 h-10 text-muted" />
          </div>
          <h4 className="text-lg font-serif-display text-ink">Deployment Blank</h4>
          <p className="text-sm text-muted font-serif-body max-w-xs mt-2">No personnel found within current sector filters.</p>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {editEntry && (
          <StaffEditModal
            key="edit-modal"
            entry={editEntry}
            projects={projects}
            posts={posts}
            onClose={() => setEditEntry(null)}
            onSuccess={() => { setEditEntry(null); onRefresh(); }}
          />
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/20"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 bg-paper p-8 w-full max-w-sm border border-rule text-center"
            >
              <div className="w-16 h-16 bg-bad/10 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-bad" />
              </div>
              <h3 className="text-2xl font-serif-display text-ink">Revoke Authorization?</h3>
              <p className="text-sm text-muted font-serif-body mt-2 px-4 leading-relaxed">
                Personnel <span className="text-ink">{deleteTarget.partyName}</span> will be permanently purged from central records.
              </p>
              <div className="flex gap-4 mt-8">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-4 border border-rule bg-paper font-mono text-[11px] tracking-[0.18em] uppercase text-muted"
                >
                  Abort
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-bad text-white font-mono text-[11px] tracking-[0.18em] uppercase"
                >
                  Confirm Purge
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default StaffTable;

function ActionBtn({ id, icon, label, onClick, color }: { id: string; icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; color: string }) {
  const colors: Record<string, string> = {
    accent: 'bg-accent/10 text-accent hover:bg-accent/20',
    bad: 'bg-bad/10 text-bad hover:bg-bad/20',
    muted: 'bg-panel text-muted hover:bg-panel',
  };
  return (
    <motion.button
      id={id}
      onClick={onClick} title={label}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn("p-2 transition-all", colors[color])}
    >
      {icon}
    </motion.button>
  );
}
