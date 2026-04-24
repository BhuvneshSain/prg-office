import { useState } from 'react';
import { UploadCloud, CheckCircle2, XCircle, Loader2, File as FileIcon, ArrowRight } from 'lucide-react';
import type { RegisterEntry } from '../types';
import { addRegisterEntry } from '../lib/dataService';
import { uploadAttachment } from '../lib/fileService';
import { ComboBox, MultiComboBox } from './ComboBox';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EntryFormProps {
  type: 'inward' | 'outward';
  existingDepts: string[];
  existingProjects: string[];
  onSuccess: () => void;
}

export default function EntryForm({ type, existingDepts, existingProjects, onSuccess }: EntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fileError, setFileError] = useState('');
  
  const [dispatchTo, setDispatchTo] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    subject: '',
    referenceNumber: '',
    remarks: '',
    project: ''
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [isBatchMode, setIsBatchMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileError) return;
    
    setLoading(true);
    setUploadProgress({ current: 0, total: 0 });
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      if (files.length === 0) {
        throw new Error('Please select at least one document.');
      }

      const uploadWithProgress = async (f: File[]) => {
        setUploadProgress({ current: 0, total: f.length });
        const uploaded = [];
        for (let i = 0; i < f.length; i++) {
          const res = await uploadAttachment(f[i]);
          if (res) uploaded.push(res);
          setUploadProgress({ current: i + 1, total: f.length });
        }
        return uploaded;
      };

      if (isBatchMode) {
        let successCount = 0;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress({ current: i + 1, total: files.length });
          
          const attachment = await uploadAttachment(file);
          if (!attachment) continue;

          const baseRef = parseInt(formData.referenceNumber) || 0;
          const currentRef = baseRef + i;

          const newEntry: RegisterEntry = {
            id: (Date.now() + i).toString(),
            type,
            date: formData.date,
            partyName: formData.partyName,
            subject: file.name.split('.')[0],
            referenceNumber: currentRef.toString(),
            remarks: formData.remarks,
            project: formData.project,
            attachments: [attachment]
          };
          
          const ok = await addRegisterEntry(newEntry);
          if (ok) successCount++;
        }
        
        if (successCount > 0) {
          setSuccessMsg(`Successfully batch registered ${successCount} ${type} records.`);
          setFiles([]);
          onSuccess();
        } else {
          throw new Error('Batch synchronization failed.');
        }
      } else {
        const attachments = await uploadWithProgress(files);
        if (attachments.length === 0) throw new Error('Upload failed.');

        const finalRefNumber = type === 'outward' && dispatchTo.trim() 
          ? `${formData.referenceNumber}-${dispatchTo}`
          : formData.referenceNumber;

        const newEntry: RegisterEntry = {
          id: Date.now().toString(),
          type,
          date: formData.date,
          partyName: formData.partyName,
          subject: formData.subject,
          referenceNumber: finalRefNumber,
          remarks: formData.remarks,
          project: formData.project,
          attachments: attachments
        };
        
        const success = await addRegisterEntry(newEntry);
        if (success) {
          setSuccessMsg(`Successfully saved ${type} record with ${attachments.length} attachments.`);
          setFiles([]);
          onSuccess();
        } else {
          throw new Error('Failed to save JSON data.');
        }
      }

      setFormData({ ...formData, subject: '', remarks: '', referenceNumber: '', partyName: '', project: '' });
      setDispatchTo('');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[40px] p-6 md:p-10 w-full max-w-3xl mx-auto shadow-glass border-white/60 relative overflow-hidden" 
      aria-labelledby="form-title"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-violet/5 rounded-bl-[100px] pointer-events-none" />
      
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 id="form-title" className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] capitalize leading-none">New {type}</h2>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mt-2 flex items-center gap-2">
            Record Authorization <span className="w-1 h-1 rounded-full bg-cyber-violet/40" />
          </p>
        </div>
        <motion.span 
          whileHover={{ scale: 1.05 }}
          className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
            type === 'inward' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
          )}
        >
          {type} Terminal
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
            <p className="text-emerald-800 font-bold text-sm">{successMsg}</p>
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
            <p className="text-red-800 font-bold text-sm">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2.5">
            <label htmlFor="entry-date" className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Log Date</label>
            <input 
              id="entry-date"
              type="date" required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-5 py-3.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[22px] focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet outline-none transition-all font-bold text-sm text-[var(--text-primary)] focus:bg-[var(--bg-surface)]"
            />
          </div>
          <div className="space-y-2.5">
            <label htmlFor="dispatch-no" className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">{type === 'outward' ? 'Dispatch Range' : 'Dispatch No.'}</label>
            <div className="flex items-center gap-3 w-full">
              <input 
                id="dispatch-no"
                type="number" required placeholder="e.g., 1024"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                className="w-full px-5 py-3.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[22px] focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet outline-none transition-all placeholder:text-[var(--text-muted)] font-bold text-sm text-[var(--text-primary)] focus:bg-[var(--bg-surface)]"
              />
              {type === 'outward' && (
                <>
                  <span className="text-[var(--text-muted)] font-black">—</span>
                  <input 
                    aria-label="Dispatch To number"
                    type="number" placeholder="End ref"
                    value={dispatchTo}
                    onChange={(e) => setDispatchTo(e.target.value)}
                    className="w-full px-5 py-3.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[22px] focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet outline-none transition-all placeholder:text-[var(--text-muted)] font-bold text-sm text-[var(--text-primary)] focus:bg-[var(--bg-surface)]"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <div className="space-y-2.5 relative">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">{type === 'inward' ? 'Origin Dept' : 'Recipient Dept(s)'}</label>
            {type === 'outward' ? (
              <MultiComboBox 
                values={formData.partyName.split('|||').filter(Boolean)}
                onChange={(vals) => setFormData({...formData, partyName: vals.join('|||')})}
                options={existingDepts}
                placeholder="Select departments..."
              />
            ) : (
              <ComboBox 
                value={formData.partyName}
                onChange={(val) => setFormData({...formData, partyName: val})}
                options={existingDepts}
                placeholder="Select department..."
              />
            )}
          </div>
          <div className="space-y-2.5 relative">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Assigned Project</label>
            <ComboBox 
              value={formData.project || ''}
              onChange={(val) => setFormData({...formData, project: val})}
              options={existingProjects}
              placeholder="Select project..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2.5">
            <label htmlFor="rajkaj-ref" className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">RajKaj Identifier</label>
            <input 
              id="rajkaj-ref"
              type="number" placeholder="e.g., 50123"
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              className="w-full px-5 py-3.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[22px] focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet outline-none transition-all placeholder:text-[var(--text-muted)] font-bold text-sm text-[var(--text-primary)] focus:bg-[var(--bg-surface)]"
            />
          </div>
          <div className="space-y-2.5">
            <label htmlFor="subject" className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Context / Subject</label>
            <input 
              id="subject"
              type="text" required={!isBatchMode} placeholder={isBatchMode ? "Auto-filled from filename" : "Description..."}
              disabled={isBatchMode}
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full px-5 py-3.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[22px] focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet outline-none transition-all placeholder:text-[var(--text-muted)] font-bold text-sm text-[var(--text-primary)] focus:bg-[var(--bg-surface)] disabled:opacity-50"
            />
          </div>
        </div>

        <div className="p-6 bg-[var(--bg-page)] rounded-[32px] border border-[var(--border-primary)] flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                isBatchMode ? "bg-cyber-violet/10 text-cyber-violet" : "bg-slate-100 text-slate-400"
              )}>
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Upload Intelligence</p>
                <h4 className="text-sm font-black text-[var(--text-primary)]">Sequential Batch Processing</h4>
              </div>
           </div>
           
           <button 
             type="button"
             onClick={() => setIsBatchMode(!isBatchMode)}
             className={cn(
               "relative w-14 h-8 rounded-full transition-colors duration-300",
               isBatchMode ? "bg-cyber-violet" : "bg-slate-200"
             )}
           >
             <motion.div 
               animate={{ x: isBatchMode ? 26 : 4 }}
               className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-sm"
             />
           </button>
        </div>

        <div className="space-y-3 pt-2">
          <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] ml-2">Attached Document</label>
          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
              "relative border-2 border-dashed rounded-[28px] p-8 text-center transition-all duration-300 group cursor-pointer",
              fileError ? "border-red-300 bg-red-50/50" : "border-[var(--border-primary)] bg-[var(--bg-page)] hover:bg-[var(--bg-surface)] hover:border-cyber-violet hover:shadow-lg hover:shadow-cyber-violet/5"
            )}
          >
            <input 
              type="file" 
              multiple
              accept="application/pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                setFileError('');
                if (e.target.files) {
                  const filesArray = Array.from(e.target.files);
                  const invalid = filesArray.find(f => f.type !== 'application/pdf');
                  if (invalid) {
                    setFileError('Invalid format found. PDFs only.');
                    return;
                  }
                  if (filesArray.length > 20) {
                    setFileError('Limit exceeded (Max 20 files).');
                    return;
                  }
                  setFiles(filesArray);
                }
              }}
            />
            {files.length > 0 ? (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-[22px] bg-cyber-violet/10 flex items-center justify-center mb-1 border border-cyber-violet/10">
                   <FileIcon className="w-8 h-8 text-cyber-violet" />
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--text-primary)]">{files.length} File{files.length !== 1 && 's'} Selected</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-2 px-10">
                    {files.slice(0, 3).map(f => (
                      <span key={f.name} className="text-[9px] font-bold bg-[var(--bg-surface)] px-2 py-0.5 rounded-full border border-[var(--border-primary)] text-[var(--text-muted)] truncate max-w-[120px]">{f.name}</span>
                    ))}
                    {files.length > 3 && <span className="text-[9px] font-bold text-cyber-violet">+{files.length - 3} more</span>}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                 <div className="w-16 h-16 rounded-[22px] bg-[var(--bg-page)] group-hover:bg-cyber-violet/10 flex items-center justify-center mb-1 transition-colors border border-[var(--border-primary)]">
                   <UploadCloud className="w-8 h-8 text-[var(--text-muted)] group-hover:text-cyber-violet transition-colors" />
                </div>
                <div>
                  <p className={cn("text-sm font-extrabold tracking-tight", fileError ? "text-red-500" : "text-[var(--text-secondary)]")}>
                    {fileError || "Vault Upload Terminal"}
                  </p>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">Multiple Selection Active (Max 10MB/file)</p>
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
            className={cn(
              "w-full py-5 rounded-[22px] text-white font-black shadow-xl transition-all disabled:opacity-70 flex items-center justify-center gap-3",
              type === 'inward' ? "bg-slate-900 shadow-slate-900/10" : "bg-cyber-violet shadow-cyber-violet/20"
            )}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="tracking-tight uppercase text-xs font-black">Syncing {uploadProgress.current}/{uploadProgress.total}</span>
                </div>
                <div className="w-48 h-1 bg-white/20 rounded-full mt-1 overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                     className="h-full bg-white"
                   />
                </div>
              </div>
            ) : (
              <>
                <span className="tracking-tight uppercase text-xs font-black">Finalize {type} Registration</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.section>
  );
}

