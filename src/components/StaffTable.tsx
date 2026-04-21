import React, { useState } from 'react';
import { Users, Pencil, Trash2, Search, FolderOpen, Phone, GripVertical, UserX, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { deleteRegisterEntry, saveRegisterData } from '../lib/dataService';
import StaffEditModal from './StaffEditModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

export default function StaffTable({ data, projects, posts, onRefresh }: StaffTableProps) {
  const [search, setSearch] = useState('');
  const [editEntry, setEditEntry] = useState<RegisterEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RegisterEntry | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const filtered = data.filter((s) => 
    s.partyName.toLowerCase().includes(search.toLowerCase()) || 
    s.subject.toLowerCase().includes(search.toLowerCase()) ||
    (s.mobile ?? '').includes(search) ||
    (s.project ?? '').toLowerCase().includes(search.toLowerCase())
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
    
    const items = Array.from(data);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const ok = await saveRegisterData('staff', items);
    if (ok) onRefresh();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card rounded-[32px] border-white/60 overflow-hidden shadow-glass"
    >
      <div className="p-6 border-b border-white/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/40">
        <div>
          <h3 className="text-lg font-black flex items-center gap-2 text-slate-800 tracking-tight">
            <Users className="w-5 h-5 text-cyber-violet" /> Personnel Directory
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-cyber-violet/40" /> Active Service Records
          </p>
        </div>

        <div className="relative group w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyber-violet transition-colors" />
          <input 
            placeholder="Search personnel..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet transition-all placeholder:text-slate-300"
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <DragDropContext onDragEnd={onDragEnd}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] border-b border-slate-100/50">
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
                  <LayoutGroup>
                    {filtered.map((row, index) => (
                      <Draggable key={row.id} draggableId={row.id} index={index} isDragDisabled={!!search}>
                        {(provided, snapshot) => (
                          <motion.tr
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onMouseEnter={() => setHoveredRow(row.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "relative group transition-all duration-300 border-b border-slate-50/50",
                              snapshot.isDragging ? "z-50 shadow-2xl scale-[1.02] bg-white/90 backdrop-blur-xl border-cyber-violet/20" : "bg-transparent"
                            )}
                            style={provided.draggableProps.style}
                          >
                            {/* Hover Highlight */}
                            <AnimatePresence>
                              {hoveredRow === row.id && !snapshot.isDragging && (
                                <motion.td 
                                  layoutId="staff-hover"
                                  className="absolute inset-x-2 inset-y-1.5 bg-cyber-violet/[0.03] rounded-2xl -z-10 pointer-events-none border border-cyber-violet/5"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                />
                              )}
                            </AnimatePresence>

                            {!search && (
                              <td className="px-4 py-4 text-center align-middle" {...provided.dragHandleProps}>
                                <div className="p-1 rounded-lg hover:bg-white hover:shadow-sm transition-all inline-block group-hover:text-cyber-violet text-slate-200">
                                  <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing" />
                                </div>
                              </td>
                            )}
                            <td className="px-6 py-4">
                              <span className="text-sm font-black text-slate-800 tracking-tight group-hover:text-cyber-violet transition-colors">
                                {row.partyName}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[11px] font-bold text-slate-400 font-mono tracking-tighter bg-slate-100/50 px-2 py-1 rounded-lg">
                                {row.referenceNumber || 'HIDDEN'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-cyber-violet/5 text-cyber-violet px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-cyber-violet/10 shadow-sm">
                                {row.subject}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {row.mobile ? (
                                <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-800 transition-colors">
                                  <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                                    <Phone className="w-3 h-3" />
                                  </div>
                                  <span className="text-xs font-bold font-mono tracking-tight">{row.mobile}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Unlinked</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1.5">
                                {(row.project ?? '').split(SEP).filter(Boolean).map((p: string) => (
                                  <motion.span 
                                    whileHover={{ scale: 1.05 }}
                                    key={p} 
                                    className="bg-white border border-slate-100 text-slate-600 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 shadow-sm"
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyber-violet/40" /> {p}
                                  </motion.span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                <motion.button 
                                  whileHover={{ scale: 1.1, backgroundColor: '#f5f3ff' }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setEditEntry(row)} 
                                  className="p-2 rounded-xl text-slate-400 hover:text-cyber-violet transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </motion.button>
                                <motion.button 
                                  whileHover={{ scale: 1.1, backgroundColor: '#fef2f2' }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => setDeleteTarget(row)} 
                                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </Draggable>
                    ))}
                  </LayoutGroup>
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </table>
        </DragDropContext>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="p-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-[30px] bg-slate-50 flex items-center justify-center mb-6">
            <UserX className="w-10 h-10 text-slate-200" />
          </div>
          <h4 className="text-lg font-black text-slate-700 tracking-tight">Deployment Blank</h4>
          <p className="text-sm text-slate-400 font-bold max-w-xs mt-2">No personnel found within current sector filters.</p>
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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
              onClick={() => setDeleteTarget(null)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 bg-white/90 backdrop-blur-2xl p-8 rounded-[40px] w-full max-w-sm shadow-glass border border-white/60 text-center"
            >
              <div className="w-16 h-16 rounded-[22px] bg-red-50 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Revoke Authorization?</h3>
              <p className="text-sm text-slate-400 font-bold mt-2 px-4 leading-relaxed">
                Personnel <span className="text-slate-800">{deleteTarget.partyName}</span> will be permanently purged from central records.
              </p>
              <div className="flex gap-4 mt-8">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteTarget(null)} 
                  className="flex-1 py-4 border border-slate-200/60 bg-white rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500"
                >
                  Abort
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete} 
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-200"
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
}
