import React, { useState } from 'react';
import { Users, CheckCircle2, XCircle, Loader2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RegisterEntry } from '../types';
import { addRegisterEntry } from '../lib/dataService';
import { MultiComboBox } from './ComboBox';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SEP = '|||';

interface StaffFormProps {
  existingProjects: string[];
  existingPosts: string[];
  onSuccess: () => void;
}

export default function StaffForm({ existingProjects, existingPosts, onSuccess }: StaffFormProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ name: '', empId: '', post: '', mobile: '' });
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.post.trim()) { setErrorMsg('Name and Post are required.'); return; }
    setLoading(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const entry: RegisterEntry = {
        id: Date.now().toString(), type: 'staff', date: new Date().toISOString().split('T')[0],
        partyName: form.name.trim(), subject: form.post.trim(), referenceNumber: form.empId.trim(),
        mobile: form.mobile.trim(),
        remarks: '', project: selectedProjects.join(SEP), attachments: [],
      };
      const ok = await addRegisterEntry(entry);
      if (!ok) throw new Error('Failed to save to Dropbox.');
      setSuccessMsg(`Staff Member "${form.name}" successfully onboarded.`);
      setForm({ name: '', empId: '', post: '', mobile: '' }); setSelectedProjects([]); onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message);
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
          <Users className="w-4 h-4 text-muted" />
          <div>
            <h3 className="font-serif-display italic text-base">Onboard Personnel</h3>
            <p className="font-mono text-[10px] text-muted tracking-[0.16em] uppercase mt-0.5">Staff management</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Full Name</label>
            <input required placeholder="Operator Name" className={INPUT_CLS} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Employee ID</label>
            <input placeholder="ID-0000" className={INPUT_CLS} value={form.empId} onChange={e => set('empId', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Mobile</label>
            <input placeholder="+91 00000 00000" className={INPUT_CLS} value={form.mobile} onChange={e => set('mobile', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Rank / Post</label>
            <select
              required
              className={cn(INPUT_CLS, "appearance-none")}
              value={form.post}
              onChange={e => set('post', e.target.value)}
            >
              <option value="">Select Rank...</option>
              {existingPosts.map((p: string) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Project Assignments</label>
          <MultiComboBox
            values={selectedProjects}
            onChange={(vals) => setSelectedProjects(vals)}
            options={existingProjects}
            placeholder="Search and assign projects..."
          />
        </div>

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

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-paper font-mono text-[11px] tracking-[0.18em] uppercase py-3.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-ink/90"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Complete Onboarding</span>
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}

const LABEL_CLS = "block font-mono text-[11px] text-muted tracking-[0.18em] uppercase";
const INPUT_CLS = "w-full px-4 py-3 bg-panel border border-rule text-ink placeholder:text-muted/50 focus:outline-none focus:border-ink font-serif-body text-sm transition-colors";
