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
        attachmentData = await uploadAttachment(file, 'orders', formData.project, formData.remarks, formData.subject);
        if (!attachmentData) throw new Error('Failed to upload file to Dropbox.');
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
        setSuccessMsg('Successfully saved Important Order.');
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-rule p-5 sm:p-8 w-full max-w-3xl mx-auto"
    >
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="font-serif-display italic text-2xl leading-none">Order Log</h2>
          <p className="font-mono text-[11px] text-muted tracking-[0.18em] uppercase mt-1.5">Priority authorization</p>
        </div>
        <span className="font-mono text-[10px] text-accent tracking-[0.16em] uppercase border border-accent/30 px-2 py-0.5">
          Important
        </span>
      </div>

      <AnimatePresence mode="wait">
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 border border-good/30 bg-good/5 flex items-center gap-3"
          >
            <CheckCircle2 className="w-4 h-4 text-good shrink-0" />
            <p className="text-good text-sm">{successMsg}</p>
          </motion.div>
        )}

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 border border-bad/30 bg-bad/5 flex items-center gap-3"
          >
            <XCircle className="w-4 h-4 text-bad shrink-0" />
            <p className="text-bad text-sm">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Date Issued</label>
            <input
              type="date" required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-1.5 relative">
            <label className={LABEL_CLS}>Associated Project</label>
            <ComboBox
              value={formData.project}
              onChange={(val) => setFormData({...formData, project: val})}
              options={existingProjects}
              placeholder="Select project..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>RajKaj Identifier</label>
            <input
              type="number" placeholder="e.g., 50123"
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>Subject / Title</label>
            <input
              type="text" required placeholder="Description..."
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* File upload */}
        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Verified PDF Component</label>
          <div
            className={cn(
              "relative border-2 border-dashed p-6 text-center transition-colors group cursor-pointer",
              fileError ? "border-bad/40 bg-bad/5" : "border-rule hover:border-ink hover:bg-panel"
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
                  if (selected.type !== 'application/pdf') { setFileError('PDF required.'); setFile(null); return; }
                  if (selected.size > 10 * 1024 * 1024) { setFileError('Max 10MB.'); setFile(null); return; }
                  setFile(selected);
                }
              }}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <FileIcon className="w-6 h-6 text-accent" />
                <p className="font-serif-body text-sm text-ink">{file.name}</p>
                <p className="font-mono text-[10px] text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <UploadCloud className="w-6 h-6 text-muted group-hover:text-ink transition-colors" />
                <p className={cn("font-serif-body text-sm", fileError ? "text-bad" : "text-muted")}>
                  {fileError || "Drop PDF here or click to browse"}
                </p>
                <p className="font-mono text-[10px] text-muted">Max 10MB</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-rule">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-accent text-paper font-mono text-[11px] tracking-[0.18em] uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-accent/90"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synchronizing...</span>
              </div>
            ) : (
              <>
                <span>Save Important Order</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}

const LABEL_CLS = "block font-mono text-[11px] text-muted tracking-[0.18em] uppercase";
const INPUT_CLS = "w-full px-4 py-3 bg-panel border border-rule text-ink placeholder:text-muted/50 focus:outline-none focus:border-ink font-serif-body text-sm transition-colors";
