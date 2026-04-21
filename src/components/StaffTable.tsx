import { useState } from 'react';
import { Users, Pencil, Trash2, Search, FolderOpen, Phone, GripVertical } from 'lucide-react';
import { deleteRegisterEntry, saveRegisterData } from '../lib/dropbox';
import StaffEditModal from './StaffEditModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

import type { RegisterEntry } from '../types';

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
    else alert('Failed to save new order.');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold flex items-center gap-2 text-slate-800"><Users className="w-4 h-4 text-violet-500" /> Staff Directory</h3>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Search..." className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-violet-500 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                {!search && <th className="w-10 px-2 py-3"></th>}
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Post</th>
                <th className="px-5 py-3">Mobile</th>
                <th className="px-5 py-3">Projects</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <Droppable droppableId="staff-list">
              {(provided) => (
                <tbody {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-slate-100">
                  {filtered.map((row, index) => (
                    <Draggable key={row.id} draggableId={row.id} index={index} isDragDisabled={!!search}>
                      {(provided, snapshot) => (
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`hover:bg-slate-50/50 transition-colors ${snapshot.isDragging ? 'bg-indigo-50/80 shadow-lg ring-1 ring-indigo-200' : ''}`}
                          style={{
                            ...provided.draggableProps.style,
                            display: snapshot.isDragging ? 'table' : 'table-row'
                          }}
                        >
                          {!search && (
                            <td className="px-2 py-3 text-center align-middle" {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-slate-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing mx-auto" />
                            </td>
                          )}
                          <td className="px-5 py-3 font-bold text-slate-700">{row.partyName}</td>
                          <td className="px-5 py-3 text-slate-500 font-mono text-xs">{row.referenceNumber || '—'}</td>
                          <td className="px-5 py-3">
                            <span className="bg-violet-50 text-violet-700 px-2 py-1 rounded-full text-xs font-bold border border-violet-100">
                              {row.subject}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-600 font-medium">
                            {row.mobile ? (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {row.mobile}
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-1">
                              {(row.project ?? '').split(SEP).filter(Boolean).map((p: string) => (
                                <span key={p} className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full text-[10px] font-medium border border-indigo-100 flex items-center gap-1">
                                  <FolderOpen className="w-2.5 h-2.5" /> {p}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => setEditEntry(row)} className="p-1.5 hover:bg-violet-50 rounded-lg text-slate-400 hover:text-violet-600 transition-colors"><Pencil className="w-4 h-4" /></button>
                              <button onClick={() => setDeleteTarget(row)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </table>
        </DragDropContext>
      </div>
      {editEntry && <StaffEditModal entry={editEntry} projects={projects} posts={posts} onClose={() => setEditEntry(null)} onSuccess={() => { setEditEntry(null); onRefresh(); }} />}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-80 text-center">
            <h3 className="font-bold mb-2 text-lg">Delete Member?</h3>
            <p className="text-sm text-slate-500 mb-4">Are you sure you want to remove {deleteTarget.partyName}?</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-slate-200 rounded-xl">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
