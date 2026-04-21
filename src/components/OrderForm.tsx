import { useState } from 'react';
import { UploadCloud, CheckCircle2, XCircle, Loader2, File as FileIcon, ArrowRight } from 'lucide-react';
import type { RegisterEntry } from '../types';
import { addRegisterEntry } from '../lib/dataService';
import { uploadAttachment } from '../lib/fileService';
import { ComboBox } from './ComboBox';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[40px] p-6 md:p-10 w-full max-w-3xl mx-auto border-white/60 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-bl-[100px] pointer-events-none" />
      
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 leading-none">Order Log</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            Priority Authorization <span className="w-1 h-1 rounded-full bg-amber-400/60" />
          </p>
        </div>
        <motion.span 
          whileHover={{ scale: 1.05 }}
          className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 shadow-sm"
        >
          Important Orders
        </motion.span>
      </div>

      <AnimatePresence mode="wait">
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-5 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-emerald-800 font-bold text-sm tracking-tight">{successMsg}</p>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-5 rounded-3xl bg-red-50 border border-red-100 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-red-800 font-bold text-sm tracking-tight">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end relative">
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Date Issued</label>
            <input 
              type="date" required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-5 py-3.5 bg-white/40 border border-slate-200/60 rounded-[22px] focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all font-bold text-sm text-slate-800"
            />
          </div>
          <div className="space-y-2.5 relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Associated Project</label>
            <ComboBox 
              value={formData.project}
              onChange={(val) => setFormData({...formData, project: val})}
              options={existingProjects}
              placeholder="Select project..."
              activeColor="amber"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">RajKaj Identifier</label>
            <input 
              type="number" placeholder="e.g., 50123"
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              className="w-full px-5 py-3.5 bg-white/40 border border-slate-200/60 rounded-[22px] focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all placeholder:text-slate-300 font-bold text-sm text-slate-800"
            />
          </div>
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Subject / Title</label>
            <input 
              type="text" required placeholder="Description..."
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full px-5 py-3.5 bg-white/40 border border-slate-200/60 rounded-[22px] focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 outline-none transition-all placeholder:text-slate-300 font-bold text-sm text-slate-800"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Verified PDF Component</label>
          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "relative border-2 border-dashed rounded-[28px] p-8 text-center transition-all duration-300 group cursor-pointer",
              fileError ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-amber-400 hover:shadow-lg hover:shadow-amber-400/5"
            )}
          >
            <input 
              type="file" 
              accept="application/pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                setFileError('');
                if (e.target.files && e.target.files[0]) {
                  const selected = e.target.files[0];
                  if (selected.type !== 'application/pdf') {
                    setFileError('Invalid format. PDF required.');
                    setFile(null);
                    return;
                  }
                  if (selected.size > 10 * 1024 * 1024) {
                    setFileError('Max size (10MB) exceeded.');
                    setFile(null);
                    return;
                  }
                  setFile(selected);
                }
              }}
            />
            {file ? (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-[22px] bg-amber-50 flex items-center justify-center mb-1">
                   <FileIcon className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">{file.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest tracking-tight">{(file.size / 1024 / 1024).toFixed(2)} MB • READY FOR SYNC</p>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                 <div className="w-16 h-16 rounded-[22px] bg-slate-100 group-hover:bg-amber-50 flex items-center justify-center mb-1 transition-colors">
                   <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-amber-500 transition-colors" />
                </div>
                <div>
                  <p className={cn("text-sm font-extrabold tracking-tight", fileError ? "text-red-500" : "text-slate-600")}>
                    {fileError || "Official Order Uplink"}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest tracking-tight">Attach signed PDF components (Max 10MB)</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="pt-8 border-t border-slate-100/50">
          <motion.button 
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            className="w-full py-5 rounded-[22px] bg-amber-500 text-white font-black shadow-xl shadow-amber-500/20 transition-all disabled:opacity-70 flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white group-hover:opacity-10 opacity-0 transition-opacity" />
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="tracking-tight uppercase text-xs font-black">Synchronizing...</span>
              </>
            ) : (
              <>
                <span className="tracking-tight uppercase text-xs font-black">Save Important Order</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
