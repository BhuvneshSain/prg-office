import { useState } from 'react';
import { UploadCloud, CheckCircle2, XCircle, Loader2, File as FileIcon } from 'lucide-react';
import type { RegisterEntry } from '../types';
import { addRegisterEntry, uploadAttachment } from '../lib/dropbox';
import { ComboBox } from './ComboBox';

interface OrderFormProps {
  existingProjects: string[];
  onSuccess: () => void;
}

export default function OrderForm({ existingProjects, onSuccess }: OrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fileError, setFileError] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: '',   
    project: '', 
    remarks: '' 
  });
  
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileError) return;
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      let attachmentData = null;
      if (file) {
        attachmentData = await uploadAttachment(file);
        if (!attachmentData) {
          throw new Error('Failed to upload file to Dropbox.');
        }
      }
      
      const newEntry: RegisterEntry = {
        id: Date.now().toString(),
        type: 'orders',
        date: formData.date,
        partyName: '',
        subject: formData.subject,
        referenceNumber: '',
        remarks: formData.remarks,
        project: formData.project,
        attachments: attachmentData ? [attachmentData] : []
      };
      
      const success = await addRegisterEntry(newEntry);
      
      if (success) {
        setSuccessMsg(`Successfully saved Important Order.`);
        setFormData({ ...formData, subject: '', project: '', remarks: '' });
        setFile(null);
        onSuccess();
      } else {
        throw new Error('Failed to save JSON data to Dropbox.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 w-full max-w-3xl mx-auto">
      <div className="mb-6 pb-4 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Log Important Order</h2>
        <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-100/60 text-amber-700">
          Orders
        </span>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
          <p className="text-emerald-700 font-medium text-sm">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl relative bg-red-50/80 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-red-700 font-medium text-sm">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Date Issued</label>
            <input 
              type="date" required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Project</label>
            <ComboBox 
              value={formData.project}
              onChange={(val) => setFormData({...formData, project: val})}
              options={existingProjects}
              placeholder="Select project..."
              activeColor="amber"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
           <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">RajKaj Ref. No. (Optional)</label>
            <input 
              type="number" placeholder="e.g., 50123"
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Subject</label>
            <input 
              type="text" required placeholder="Subject or Title..."
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-sm font-semibold text-slate-700">Attached Document (PDF Only)</label>
          <div className={`relative border-2 border-dashed ${fileError ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50 hover:border-amber-300 hover:scale-[1.01] hover:shadow-sm active:scale-[0.99]'} rounded-2xl p-6 text-center transition-all duration-300 ease-out group`}>
            <input 
              type="file" 
              accept="application/pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                setFileError('');
                if (e.target.files && e.target.files[0]) {
                  const selected = e.target.files[0];
                  if (selected.type !== 'application/pdf') {
                    setFileError('Only PDF files are allowed.');
                    setFile(null);
                    return;
                  }
                  setFile(selected);
                }
              }}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                   <FileIcon className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • Click to replace</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                 <div className="w-12 h-12 rounded-full bg-slate-200 group-hover:bg-amber-100 flex items-center justify-center mb-2 transition-colors">
                   <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-amber-600 transition-colors" />
                </div>
                <p className={`text-sm font-semibold ${fileError ? 'text-red-600' : 'text-slate-700'}`}>{fileError || <>Drag & drop or <span className="text-amber-600">click to browse</span></>}</p>
                <p className="text-xs text-slate-500">Attach officially signed orders here (PDF)</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full relative py-4 rounded-xl text-white font-semibold shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(245,158,11,0.3)] active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 to-orange-500`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving to Dropbox...
              </span>
            ) : (
              `Save Important Order`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

