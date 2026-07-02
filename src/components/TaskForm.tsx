import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, XCircle, Loader2, Plus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TaskEntry, TaskStatus, TaskPriority, RegisterEntry, RecurrenceInterval } from '../types';
import { addTask, updateTask, getSettings, getRegisterData } from '../lib/dataService';
import { triggerTaskWhatsAppAlerts } from '../lib/whatsappService';
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
    isRecurring: false,
    recurrenceInterval: 'none' as RecurrenceInterval,
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
        isRecurring: editTask.isRecurring || false,
        recurrenceInterval: editTask.recurrenceInterval || 'none',
      });
      setSelectedAssignees(editTask.assignedTo);
    } else if (linkedDoc) {
      setForm(f => ({
        ...f,
        title: `Reply to: ${linkedDoc.subject}`,
        description: `Follow up on inward document from ${linkedDoc.partyName} (Ref: ${linkedDoc.referenceNumber})`,
        isRecurring: false,
        recurrenceInterval: 'none',
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
        
        // Trigger background WhatsApp alert
        try {
          const [settingsData, staffList] = await Promise.all([
            getSettings(),
            getRegisterData('staff')
          ]);
          await triggerTaskWhatsAppAlerts(updated, staffList, settingsData);
        } catch (e) {
          console.error("WhatsApp trigger failed:", e);
        }
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

        // Trigger background WhatsApp alert
        try {
          const [settingsData, staffList] = await Promise.all([
            getSettings(),
            getRegisterData('staff')
          ]);
          await triggerTaskWhatsAppAlerts(newTask, staffList, settingsData);
        } catch (e) {
          console.error("WhatsApp trigger failed:", e);
        }

        if (!onClose) {
          setForm({ title: '', description: '', priority: 'Medium', status: 'Pending', dueDate: '', isRecurring: false, recurrenceInterval: 'none' });
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-rule overflow-hidden"
    >
      <div className="px-6 py-4 bg-panel border-b border-rule flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-4 h-4 text-muted" />
          <div>
            <h3 className="font-serif-display italic text-base">
              {editTask ? 'Update Directive' : linkedDoc ? 'Create Linked Task' : 'New Task'}
            </h3>
            <p className="font-mono text-[10px] text-muted tracking-[0.16em] uppercase mt-0.5">Task scheduler</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Task Title</label>
          <input
            required
            placeholder="What needs to be done?"
            className={INPUT_CLS}
            value={form.title}
            onChange={e => set('title', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Description</label>
          <textarea
            placeholder="Detailed instructions or context..."
            className={cn(INPUT_CLS, "min-h-[80px] resize-none")}
            value={form.description}
            onChange={e => set('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Priority</label>
            <select className={INPUT_CLS} value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Status</label>
            <select className={INPUT_CLS} value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Due Date</label>
            <input type="date" className={INPUT_CLS} value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-rule pt-4">
          <div className="flex items-center gap-3 h-full min-h-[44px]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={e => {
                  const checked = e.target.checked;
                  setForm(f => ({
                    ...f,
                    isRecurring: checked,
                    recurrenceInterval: checked ? (f.recurrenceInterval === 'none' ? 'daily' : f.recurrenceInterval) : 'none'
                  }));
                }}
                className="w-4 h-4 rounded border-rule text-accent bg-panel focus:ring-accent"
              />
              <span className="font-mono text-[11px] text-ink tracking-[0.18em] uppercase">Recurring Task</span>
            </label>
          </div>

          <AnimatePresence>
            {form.isRecurring && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-1.5"
              >
                <label className={LABEL_CLS}>Recurrence Interval</label>
                <select
                  className={INPUT_CLS}
                  value={form.recurrenceInterval}
                  onChange={e => set('recurrenceInterval', e.target.value as any)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Assign Operators</label>
          <MultiComboBox
            values={selectedAssignees}
            onChange={setSelectedAssignees}
            options={staffNames}
            placeholder="Assign to staff members..."
          />
        </div>

        {linkedDoc && (
          <div className="p-3 border border-accent/20 bg-accent/5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="font-mono text-[10px] text-accent tracking-[0.12em] uppercase">Linked Document</p>
              <p className="font-serif-body text-sm text-muted mt-0.5">{linkedDoc.subject}</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 border border-good/30 bg-good/5 flex items-center gap-2 text-good"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p className="font-serif-body text-sm">{successMsg}</p>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 border border-bad/30 bg-bad/5 flex items-center gap-2 text-bad"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              <p className="font-serif-body text-sm">{errorMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 pt-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-rule bg-panel font-mono text-[11px] tracking-[0.16em] uppercase text-muted hover:text-ink hover:border-ink transition-colors"
            >
              Cancel
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className={cn(
              "flex-[2] bg-ink text-paper font-mono text-[11px] tracking-[0.18em] uppercase py-3 disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-ink/90 transition-colors",
              onClose ? "" : "w-full"
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {editTask ? <ClipboardList className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editTask ? 'Save Changes' : linkedDoc ? 'Create Linked Task' : 'Confirm Task'}</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

const LABEL_CLS = "block font-mono text-[11px] text-muted tracking-[0.18em] uppercase";
const INPUT_CLS = "w-full px-4 py-3 bg-panel border border-rule text-ink placeholder:text-muted/50 focus:outline-none focus:border-ink font-serif-body text-sm transition-colors";
