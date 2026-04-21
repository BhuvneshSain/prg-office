import { useState } from 'react';
import { Users, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { RegisterEntry } from '../types';
import { addRegisterEntry } from '../lib/dropbox';
import { MultiComboBox } from './ComboBox';

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
      setSuccessMsg(`Staff "${form.name}" added.`);
      setForm({ name: '', empId: '', post: '', mobile: '' }); setSelectedProjects([]); onSuccess();
    } catch (err: unknown) { 
      const error = err as Error;
      setErrorMsg(error.message); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="bg-white/90 border border-slate-200 shadow-sm rounded-2xl relative">
      <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3 rounded-t-2xl">
        <Users className="w-5 h-5 text-violet-600" />
        <h3 className="font-bold text-slate-800 text-sm">Add Staff Member</h3>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input required placeholder="Name" className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} />
          <input placeholder="Employee ID" className={INPUT} value={form.empId} onChange={e => set('empId', e.target.value)} />
          <input placeholder="Mobile Number" className={INPUT} value={form.mobile} onChange={e => set('mobile', e.target.value)} />
          <select required className={INPUT} value={form.post} onChange={e => set('post', e.target.value)}>
            <option value="">Select Post...</option>
            {existingPosts.map((p: string) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Assigned Projects</label>
          <MultiComboBox 
            values={selectedProjects}
            onChange={(vals) => setSelectedProjects(vals)}
            options={existingProjects}
            placeholder="Search and select projects..."
          />
        </div>
        {successMsg && <p className="text-xs text-emerald-600 font-medium bg-emerald-50 p-2 rounded-lg flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5" /> {successMsg}</p>}
        {errorMsg && <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg flex items-center gap-2"><XCircle className="w-3.5 h-3.5" /> {errorMsg}</p>}
        <button type="submit" disabled={loading} className="w-full bg-violet-600 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 overflow-hidden flex items-center justify-center gap-2">
           {loading && <Loader2 className="w-4 h-4 animate-spin" />}
           {loading ? 'Adding...' : 'Add Staff Member'}
        </button>
      </form>
    </div>
  );
}
const INPUT = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-violet-500";
