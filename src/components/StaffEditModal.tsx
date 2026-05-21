import React, { useState } from 'react';
import { X, Save, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { updateRegisterEntry } from '../lib/dataService';
import { MultiComboBox } from './ComboBox';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RegisterEntry } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SEP = '|||';

interface StaffEditModalProps {
  entry: RegisterEntry;
  projects: string[];
  posts: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function StaffEditModal({ entry, projects, posts, onClose, onSuccess }: StaffEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(entry.partyName);
  const [empId, setEmpId] = useState(entry.referenceNumber);
  const [post, setPost] = useState(entry.subject);
  const [mobile, setMobile] = useState(entry.mobile || '');
  const [selectedProjects, setSelectedProjects] = useState<string[]>((entry.project ?? '').split(SEP).filter(Boolean));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = { 
        ...entry, 
        partyName: name, 
        subject: post, 
        referenceNumber: empId, 
        mobile: mobile.trim(),
        project: selectedProjects.join(SEP) 
      };
      await updateRegisterEntry(updated);
      onSuccess();
      onClose();
    } catch { 
      alert('Security failure: Synchronization aborted.'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink/20"
        onClick={onClose} 
      />

      {/* Modal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-xl bg-paper border border-rule overflow-hidden"
      >
        <div className="px-8 py-6 border-b border-[var(--border-primary)] bg-[var(--header-bg)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-serif-display text-[var(--text-primary)] tracking-tight">Modify Personnel</h3>
              <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
                <Sparkles className="w-2.5 h-2.5" /> Personnel Database Edit
              </p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-[var(--bg-page)] flex items-center justify-center text-[var(--text-muted)] hover:text-bad transition-colors border border-rule"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)] ml-2">Operator Name</label>
              <input required className={INPUT} value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)] ml-2">Identifier</label>
              <input className={INPUT} value={empId} onChange={e => setEmpId(e.target.value)} placeholder="ID" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)] ml-2">Deployment Rank</label>
              <select required className={cn(INPUT, "appearance-none")} value={post} onChange={e => setPost(e.target.value)}>
                <option value="">Select Post...</option>
                {posts.map((p: string) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)] ml-2">Mobile Terminal</label>
              <input className={INPUT} value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Mobile" />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)] ml-2">Assigned Projects</label>
            <MultiComboBox 
              values={selectedProjects}
              onChange={(vals) => setSelectedProjects(vals)}
              options={projects}
              placeholder="Select project assignments..."
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-[var(--border-primary)]">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button" 
              onClick={onClose} 
              className="flex-1 py-4 border border-rule font-mono text-[11px] tracking-[0.16em] uppercase text-muted hover:bg-[var(--bg-page)] transition-all"
            >
              Abort
            </motion.button>
            <motion.button 
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading} 
              className={cn(
                "flex-1 py-4 bg-ink text-paper font-mono text-[11px] tracking-[0.18em] uppercase transition-all flex items-center justify-center gap-2",
                loading && "opacity-60"
              )}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Synchronizing...' : 'Commit Changes'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const INPUT = "w-full px-5 py-3.5 bg-panel border border-rule font-serif-body text-sm outline-none transition-all placeholder:text-[var(--text-muted)] text-[var(--text-primary)] focus:bg-[var(--bg-surface)] focus:outline-none focus:border-ink";
