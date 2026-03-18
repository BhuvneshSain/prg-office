import { useState, useRef } from 'react';
import { X, Save, Loader2, UploadCloud, File as FileIcon, ChevronDown } from 'lucide-react';
import type { RegisterEntry } from '../types';
import { updateRegisterEntry, uploadAttachment } from '../lib/dropbox';

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
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptInput, setDeptInput] = useState('');
  const [projOpen, setProjOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const toggle = (dept: string) =>
    setSelectedDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);

  const filteredDepts = departments.filter(d => d.toLowerCase().includes(deptInput.toLowerCase()) && !selectedDepts.includes(d));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let attachments = entry.attachments ?? [];

      // Upload new attachment if provided
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
    } catch (err: any) {
      setError(err.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const isInward = entry.type === 'inward';
  const isOutward = entry.type === 'outward';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">Editing Record</p>
            <h2 className="text-lg font-bold text-slate-800 capitalize">{entry.type} Entry</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Date + Dispatch No row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date" required>
              <input type="date" required value={form.date} onChange={e => set('date', e.target.value)}
                className={INPUT} />
            </Field>

            {isInward && (
              <Field label="Dispatch No.">
                <input type="text" value={form.referenceNumber} onChange={e => set('referenceNumber', e.target.value)}
                  placeholder="e.g., 1024" className={INPUT} />
              </Field>
            )}

            {isOutward && (
              <Field label="From Dispatch No." required>
                <div className="flex gap-2">
                  <input type="number" required value={dispatchFrom} onChange={e => setDispatchFrom(e.target.value)}
                    placeholder="From" className={INPUT} />
                  <span className="flex items-center text-slate-400 font-medium">–</span>
                  <input type="number" value={dispatchTo} onChange={e => setDispatchTo(e.target.value)}
                    placeholder="To" className={INPUT} />
                </div>
              </Field>
            )}

            {entry.type === 'orders' && (
              <Field label="RajKaj Ref. No. (Optional)">
                <input value={form.remarks} onChange={e => set('remarks', e.target.value)}
                  placeholder="e.g., 50123" className={INPUT} />
              </Field>
            )}
          </div>

          {/* Dept field */}
          {isOutward ? (
            <Field label="Recipient Dept(s)" required>
              <div className="relative z-40">
                <div
                  className="min-h-[48px] bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-wrap gap-2 cursor-text focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500"
                  onClick={() => setDeptOpen(true)}
                >
                  {selectedDepts.map(d => (
                    <div key={d} title={d} className="flex items-center gap-1 bg-white border border-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-lg max-w-[200px]">
                      <span className="truncate">{d}</span>
                      <X className="w-3 h-3 flex-shrink-0 cursor-pointer text-slate-400 hover:text-red-500"
                        onClick={e => { e.stopPropagation(); toggle(d); }} />
                    </div>
                  ))}
                  <input
                    value={deptInput} onChange={e => { setDeptInput(e.target.value); setDeptOpen(true); }}
                    onFocus={() => setDeptOpen(true)}
                    onBlur={() => setTimeout(() => { setDeptInput(''); setDeptOpen(false); }, 200)}
                    placeholder={selectedDepts.length === 0 ? 'Select departments...' : ''}
                    className="flex-1 min-w-[100px] bg-transparent outline-none text-sm px-1 placeholder:text-slate-400"
                  />
                </div>
                {deptOpen && filteredDepts.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                    {filteredDepts.map(d => (
                      <div key={d} onMouseDown={e => { e.preventDefault(); toggle(d); setDeptInput(''); }}
                        className="px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 cursor-pointer">{d}</div>
                    ))}
                  </div>
                )}
              </div>
            </Field>
          ) : isInward ? (
            <Field label="Sender Dept" required>
              <div className="relative z-30">
                <input value={form.partyName} onChange={e => { set('partyName', e.target.value); setProjOpen(false); }}
                  onFocus={() => setProjOpen(true)} onBlur={() => setTimeout(() => setProjOpen(false), 200)}
                  placeholder="Select department..." className={INPUT} />
                {projOpen && departments.filter(d => d.toLowerCase().includes(form.partyName.toLowerCase())).length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                    {departments.filter(d => d.toLowerCase().includes(form.partyName.toLowerCase())).map(d => (
                      <div key={d} onMouseDown={e => { e.preventDefault(); set('partyName', d); }}
                        className="px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 cursor-pointer">{d}</div>
                    ))}
                  </div>
                )}
              </div>
            </Field>
          ) : null}

          {/* Project */}
          <Field label="Project">
            <div className="relative z-20">
              <select value={form.project} onChange={e => set('project', e.target.value)}
                className={`${INPUT} appearance-none pr-8`}>
                <option value="">Select project...</option>
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </Field>

          {/* RajKaj + Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(isInward || isOutward) && (
              <Field label="RajKaj Ref. No. (Optional)">
                <input value={form.remarks} onChange={e => set('remarks', e.target.value)}
                  placeholder="e.g., 50123" className={INPUT} />
              </Field>
            )}
            <Field label="Subject" required>
              <input required value={form.subject} onChange={e => set('subject', e.target.value)}
                placeholder="Subject or description..." className={INPUT} />
            </Field>
          </div>

          {/* Attachment replacement */}
          <Field label="Replace Attachment (optional)">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
            >
              {newFile ? (
                <div className="flex items-center justify-center gap-2 text-indigo-600">
                  <FileIcon className="w-4 h-4" />
                  <span className="text-sm font-medium truncate">{newFile.name}</span>
                </div>
              ) : (
                <div className="text-slate-400 flex flex-col items-center gap-1">
                  <UploadCloud className="w-6 h-6" />
                  <p className="text-xs font-medium">Click to replace PDF</p>
                  {entry.attachments?.[0] && <p className="text-[11px] text-slate-300">Current: {entry.attachments[0].name}</p>}
                </div>
              )}
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                onChange={e => setNewFile(e.target.files?.[0] ?? null)} />
            </div>
          </Field>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 flex items-center gap-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400";
