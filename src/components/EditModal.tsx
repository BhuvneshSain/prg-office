import React, { useState, useRef } from 'react';
import { X, Save, Loader2, UploadCloud, File as FileIcon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RegisterEntry } from '../types';
import { updateRegisterEntry } from '../lib/dataService';
import { uploadAttachment } from '../lib/fileService';
import { ComboBox, MultiComboBox } from './ComboBox';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  entry: RegisterEntry;
  departments: string[];
  projects: string[];
  onClose: () => void;
  onSuccess: () => void;
}

const SEP = '|||';

export default function EditModal({ entry, departments, projects, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Parse existing dispatch range from referenceNumber
  const [dispatchFrom, setDispatchFrom] = useState(() => {
    if (entry.type !== 'outward') return entry.referenceNumber ?? '';
    const parts = (entry.referenceNumber ?? '').split('-');
    return parts[0] ?? '';
  });
  const [dispatchTo, setDispatchTo] = useState(() => {
    if (entry.type !== 'outward') return '';
    const parts = (entry.referenceNumber ?? '').split('-');
    return parts[1] ?? '';
  });

  const [form, setForm] = useState({
    date: entry.date,
    partyName: entry.partyName,
    subject: entry.subject,
    referenceNumber: entry.referenceNumber,
    remarks: entry.remarks ?? '',
    project: entry.project ?? '',
  });

  const [selectedDepts, setSelectedDepts] = useState<string[]>(
    entry.partyName.split(SEP).filter(Boolean)
  );

  const [newFile, setNewFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let attachments = entry.attachments ?? [];

      if (newFile) {
        const uploaded = await uploadAttachment(newFile);
        if (!uploaded) throw new Error('Failed to upload new attachment.');
        attachments = [uploaded];
      }

      let refNum = form.referenceNumber;
      if (entry.type === 'outward') {
        refNum = dispatchTo.trim() ? `${dispatchFrom}-${dispatchTo}` : dispatchFrom;
      }

      const updated: RegisterEntry = {
        ...entry,
        date: form.date,
        partyName: entry.type === 'outward' ? selectedDepts.join(SEP) : form.partyName,
        subject: form.subject,
        referenceNumber: refNum,
        remarks: form.remarks,
        project: form.project,
        attachments,
      };

      const ok = await updateRegisterEntry(updated);
      if (!ok) throw new Error('Failed to save changes to Dropbox.');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const isInward = entry.type === 'inward';
  const isOutward = entry.type === 'outward';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 b-mesh-heavy opacity-90 backdrop-blur-xl" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl bg-white/60 backdrop-blur-2xl rounded-[40px] shadow-glass border border-white/60 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/40 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className={cn("w-3.5 h-3.5", entry.type === 'orders' ? "text-amber-500" : "text-cyber-violet")} />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vault Editor</p>
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight capitalize">{entry.type} Modification</h2>
          </div>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-slate-100/50 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Field label="Log Date">
              <input type="date" required value={form.date} onChange={e => set('date', e.target.value)}
                className={INPUT} />
            </Field>

            {isInward && (
              <Field label="Reference Identifier">
                <input type="text" value={form.referenceNumber} onChange={e => set('referenceNumber', e.target.value)}
                  placeholder="e.g., 1024" className={INPUT} />
              </Field>
            )}

            {isOutward && (
              <Field label="Dispatch Spectrum">
                <div className="flex items-center gap-3">
                  <input type="number" required value={dispatchFrom} onChange={e => setDispatchFrom(e.target.value)}
                    placeholder="Start" className={INPUT} />
                  <span className="text-slate-300 font-black">—</span>
                  <input type="number" value={dispatchTo} onChange={e => setDispatchTo(e.target.value)}
                    placeholder="End" className={INPUT} />
                </div>
              </Field>
            )}

            {entry.type === 'orders' && (
              <Field label="RajKaj Primary ID">
                <input value={form.remarks} onChange={e => set('remarks', e.target.value)}
                  placeholder="e.g., 50123" className={INPUT} />
              </Field>
            )}
          </div>

          {isOutward ? (
            <Field label="Target Recipient(s)">
              <MultiComboBox 
                values={selectedDepts}
                onChange={(vals) => setSelectedDepts(vals)}
                options={departments}
                placeholder="Select departments..."
              />
            </Field>
          ) : isInward ? (
            <Field label="Origin Department">
              <ComboBox 
                value={form.partyName}
                onChange={(val) => set('partyName', val)}
                options={departments}
                placeholder="Select department..."
              />
            </Field>
          ) : null}

          <Field label="Assigned Strategic Project">
            <ComboBox 
              value={form.project}
              onChange={(val) => set('project', val)}
              options={projects}
              placeholder="Select project..."
              activeColor={entry.type === 'orders' ? 'amber' : 'indigo'}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(isInward || isOutward) && (
              <Field label="RajKaj Identifier">
                <input value={form.remarks} onChange={e => set('remarks', e.target.value)}
                  placeholder="e.g., 50123" className={INPUT} />
              </Field>
            )}
            <Field label="Subject / Context">
              <input required value={form.subject} onChange={e => set('subject', e.target.value)}
                placeholder="Description..." className={INPUT} />
            </Field>
          </div>

          <Field label="Document Uplink (PDF Replacement)">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200/60 rounded-[28px] p-6 text-center cursor-pointer hover:border-cyber-violet/40 hover:bg-white/80 hover:shadow-lg transition-all group"
            >
              {newFile ? (
                <div className="flex flex-col items-center gap-2">
                   <div className="w-12 h-12 rounded-2xl bg-cyber-violet/10 flex items-center justify-center text-cyber-violet">
                    <FileIcon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-black text-slate-800 truncate px-4">{newFile.name}</span>
                </div>
              ) : (
                <div className="text-slate-400 flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-cyber-violet/10 group-hover:text-cyber-violet transition-colors">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest leading-none">Terminal Upload</p>
                    {entry.attachments?.[0] && <p className="text-[10px] font-bold text-slate-300 mt-1">Current: {entry.attachments[0].name}</p>}
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                onChange={e => setNewFile(e.target.files?.[0] ?? null)} />
            </motion.div>
          </Field>

          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs font-black tracking-tight text-red-600 bg-red-50/80 border border-red-100 rounded-2xl px-5 py-4"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </form>

        {/* Action Panel */}
        <div className="px-8 py-8 border-t border-white/40 bg-white/40 flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button" 
            onClick={onClose}
            className="flex-1 py-4 rounded-[22px] border border-slate-200/60 bg-white shadow-sm text-slate-600 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
          >
            Abort
          </motion.button>
          <motion.button 
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            onClick={handleSave}
            disabled={loading}
            className={cn(
              "flex-1 py-4 rounded-[22px] text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-60",
              entry.type === 'orders' ? "bg-amber-500 shadow-amber-500/20" : "bg-slate-900 shadow-slate-900/20"
            )}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {loading ? 'Synchronizing...' : 'Commit Changes'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT = "w-full px-5 py-3.5 bg-white/60 border border-slate-200/60 rounded-[22px] outline-none transition-all placeholder:text-slate-300 font-bold text-sm text-slate-800 focus:bg-white focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet";
