import React, { useState } from 'react';
import { Users, CheckCircle2, XCircle, Loader2, UserPlus, Sparkles } from 'lucide-react';
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[32px] border-white/60 overflow-hidden shadow-glass"
    >
      <div className="px-8 py-5 bg-white/40 border-b border-white/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyber-violet/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-cyber-violet" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight">Onboard Personnel</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
              <Sparkles className="w-2.5 h-2.5" /> Human Capital Management
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Full Name</label>
            <input required placeholder="Operator Name" className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Employee Identifier</label>
            <input placeholder="ID-0000" className={INPUT} value={form.empId} onChange={e => set('empId', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mobile Terminal</label>
            <input placeholder="+91 00000 00000" className={INPUT} value={form.mobile} onChange={e => set('mobile', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Deployment Rank</label>
            <select 
              required 
              className={cn(INPUT, "appearance-none")} 
              value={form.post} 
              onChange={e => set('post', e.target.value)}
            >
              <option value="">Select Rank...</option>
              {existingPosts.map((p: string) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Project Assignments</label>
          <MultiComboBox 
            values={selectedProjects}
            onChange={(vals) => setSelectedProjects(vals)}
            options={existingProjects}
            placeholder="Search and authorize projects..."
          />
        </div>

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

        <motion.button 
          whileHover={{ y: -4, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit" 
          disabled={loading} 
          className="w-full bg-slate-900 text-white font-black py-4 rounded-[22px] shadow-xl shadow-slate-900/10 disabled:opacity-50 overflow-hidden flex items-center justify-center gap-2 group relative"
        >
          <div className="absolute inset-0 bg-cyber-violet opacity-0 group-hover:opacity-10 transition-opacity" />
          {loading ? (
             <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              <span className="tracking-tight uppercase text-[10px]">Complete Personnel Onboarding</span>
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}

const INPUT = "w-full px-5 py-3.5 bg-white/40 border border-slate-200/60 rounded-[22px] text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet";
