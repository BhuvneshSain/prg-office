import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, XCircle, Loader2, Plus, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskEntry, TaskStatus, TaskPriority, RegisterEntry } from '../types';
import { addTask, updateTask } from '../lib/dataService';
import { MultiComboBox } from './ComboBox';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskFormProps {
  staffNames: string[];
  onSuccess: () => void;
  editTask?: TaskEntry | null;
  linkedDoc?: RegisterEntry | null;
  onClose?: () => void;
}

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES: TaskStatus[] = ['Pending', 'In Progress', 'Completed', 'Deferred'];

export default function TaskForm({ staffNames, onSuccess, editTask, linkedDoc, onClose }: TaskFormProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium' as TaskPriority,
    status: 'Pending' as TaskStatus,
    dueDate: '',
  });
  
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  useEffect(() => {
    if (editTask) {
      setForm({
        title: editTask.title,
        description: editTask.description,
        priority: editTask.priority,
        status: editTask.status,
        dueDate: editTask.dueDate || '',
      });
      setSelectedAssignees(editTask.assignedTo);
    } else if (linkedDoc) {
      setForm(f => ({
        ...f,
        title: `Reply to: ${linkedDoc.subject}`,
        description: `Follow up on inward document from ${linkedDoc.partyName} (Ref: ${linkedDoc.referenceNumber})`,
      }));
    }
  }, [editTask, linkedDoc]);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setErrorMsg('Task title is required.'); return; }
    
    setLoading(true); setErrorMsg(''); setSuccessMsg('');
    
    try {
      if (editTask) {
        const updated: TaskEntry = {
          ...editTask,
          ...form,
          assignedTo: selectedAssignees,
          updatedAt: new Date().toISOString(),
        };
        const ok = await updateTask(updated);
        if (!ok) throw new Error('Failed to update task.');
        setSuccessMsg('Task updated successfully.');
      } else {
        const newTask: TaskEntry = {
          id: Date.now().toString(),
          ...form,
          assignedTo: selectedAssignees,
          linkedDocId: linkedDoc?.id,
          linkedDocType: linkedDoc ? 'inward' : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const ok = await addTask(newTask);
        if (!ok) throw new Error('Failed to save task.');
        setSuccessMsg('New task initialized.');
        
        // Reset form if not in "edit" or "modal" mode
        if (!onClose) {
          setForm({ title: '', description: '', priority: 'Medium', status: 'Pending', dueDate: '' });
          setSelectedAssignees([]);
        }
      }
      
      onSuccess();
      if (onClose) setTimeout(onClose, 1500);
      
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[32px] border-white/60 overflow-hidden shadow-glass bg-white/20"
    >
      <div className="px-8 py-5 bg-white/40 border-b border-white/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight">
              {editTask ? 'Update Directive' : linkedDoc ? 'Create Linked Task' : 'New Operational Task'}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-2.5 h-2.5" /> Task Scheduler v1.0
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Task Title</label>
          <input 
            required 
            placeholder="What needs to be done?" 
            className={INPUT} 
            value={form.title} 
            onChange={e => set('title', e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Description</label>
          <textarea 
            placeholder="Detailed instructions or context..." 
            className={cn(INPUT, "min-h-[100px] resize-none")} 
            value={form.description} 
            onChange={e => set('description', e.target.value)} 
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Priority</label>
            <select className={INPUT} value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Status</label>
            <select className={INPUT} value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Due Date</label>
            <input type="date" className={INPUT} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Assign Operators</label>
          <MultiComboBox 
            values={selectedAssignees}
            onChange={setSelectedAssignees}
            options={staffNames}
            placeholder="Assign to one or more staff members..."
          />
        </div>

        {linkedDoc && (
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-indigo-500 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Linked Document</p>
              <p className="text-xs font-bold text-indigo-800 mt-0.5">{linkedDoc.subject}</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center gap-3 text-emerald-700"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-xs font-black tracking-tight">{successMsg}</p>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 rounded-2xl bg-red-50/80 border border-red-100 flex items-center gap-3 text-red-700"
            >
              <XCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-black tracking-tight">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4 pt-2">
          {onClose && (
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 border border-slate-200 bg-white rounded-[22px] text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <motion.button 
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading} 
            className={cn(
              "flex-[2] bg-slate-900 text-white font-black py-4 rounded-[22px] shadow-xl shadow-slate-900/10 disabled:opacity-50 overflow-hidden flex items-center justify-center gap-2 group relative",
              editTask ? "bg-indigo-600 shadow-indigo-600/10" : ""
            )}
          >
            {loading ? (
               <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {editTask ? <ClipboardList className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                <span className="tracking-tight uppercase text-[10px]">
                  {editTask ? 'Save Changes' : linkedDoc ? 'Initialize Linked Task' : 'Confirm New Task'}
                </span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

const INPUT = "w-full px-5 py-3.5 bg-white/40 border border-slate-200/60 rounded-[22px] text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet";
