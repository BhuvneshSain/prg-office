import { useState } from 'react';
import { X } from 'lucide-react';
import { updateRegisterEntry } from '../lib/dropbox';
import { MultiComboBox } from './ComboBox';
import type { RegisterEntry } from '../types';

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
      alert('Failed to update.'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
          <h3 className="font-bold">Edit Staff Member</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input required className={INPUT} value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
            <input className={INPUT} value={empId} onChange={e => setEmpId(e.target.value)} placeholder="ID" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select required className={INPUT} value={post} onChange={e => setPost(e.target.value)}>
              <option value="">Select Post...</option>
              {posts.map((p: string) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input className={INPUT} value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Mobile" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Assigned Projects</label>
            <MultiComboBox 
              values={selectedProjects}
              onChange={(vals) => setSelectedProjects(vals)}
              options={projects}
              placeholder="Search and select projects..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl font-bold">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
const INPUT = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none focus:border-violet-500";
