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
        const finalRefNumber = type === 'outward' && dispatchTo.trim()
          ? `${formData.referenceNumber}-${dispatchTo}`
          : formData.referenceNumber;
        for (let i = 0; i < f.length; i++) {
          const res = await uploadAttachment(f[i], type, formData.project, finalRefNumber, formData.subject);
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

          const baseRef = parseInt(formData.referenceNumber) || 0;
          const currentRef = baseRef + i;
          const fileSubject = file.name.split('.')[0];

          const attachment = await uploadAttachment(file, type, formData.project, currentRef.toString(), fileSubject);
          if (!attachment) continue;

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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-rule p-5 sm:p-8 w-full max-w-3xl mx-auto"
      aria-labelledby="form-title"
    >
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 id="form-title" className="font-serif-display italic text-2xl capitalize leading-none">New {type}</h2>
          <p className="font-mono text-[11px] text-muted tracking-[0.18em] uppercase mt-1.5">Record entry</p>
        </div>
        <span className="font-mono text-[10px] text-muted tracking-[0.16em] uppercase border border-rule px-2 py-0.5">
          {type}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label htmlFor="entry-date" className={LABEL_CLS}>Log Date</label>
            <input
              id="entry-date"
              type="date" required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="dispatch-no" className={LABEL_CLS}>{type === 'outward' ? 'Dispatch Range' : 'Dispatch No.'}</label>
            <div className="flex items-center gap-2 w-full">
              <input
                id="dispatch-no"
                type="number" required placeholder="e.g., 1024"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                className={INPUT_CLS}
              />
              {type === 'outward' && (
                <>
                  <span className="text-muted font-mono">—</span>
                  <input
                    aria-label="Dispatch To number"
                    type="number" placeholder="End ref"
                    value={dispatchTo}
                    onChange={(e) => setDispatchTo(e.target.value)}
                    className={INPUT_CLS}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="space-y-1.5 relative">
            <label className={LABEL_CLS}>{type === 'inward' ? 'Origin Dept' : 'Recipient Dept(s)'}</label>
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
          <div className="space-y-1.5 relative">
            <label className={LABEL_CLS}>Assigned Project</label>
            <ComboBox
              value={formData.project || ''}
              onChange={(val) => setFormData({...formData, project: val})}
              options={existingProjects}
              placeholder="Select project..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label htmlFor="rajkaj-ref" className={LABEL_CLS}>RajKaj Identifier</label>
            <input
              id="rajkaj-ref"
              type="number" placeholder="e.g., 50123"
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="subject" className={LABEL_CLS}>Context / Subject</label>
            <input
              id="subject"
              type="text" required={!isBatchMode} placeholder={isBatchMode ? "Auto-filled from filename" : "Description..."}
              disabled={isBatchMode}
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className={cn(INPUT_CLS, "disabled:opacity-40")}
            />
          </div>
        </div>

        {/* Batch toggle */}
        <div className="p-4 border border-rule flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] text-muted tracking-[0.18em] uppercase">Upload Mode</p>
            <h4 className="font-serif-body text-sm text-ink mt-0.5">Sequential Batch Processing</h4>
          </div>
          <button
            type="button"
            onClick={() => setIsBatchMode(!isBatchMode)}
            className={cn(
              "relative w-12 h-6 transition-colors border",
              isBatchMode ? "bg-accent border-accent" : "bg-panel border-rule"
            )}
          >
            <motion.div
              animate={{ x: isBatchMode ? 24 : 2 }}
              className="absolute top-0.5 left-0 w-5 h-5 bg-paper border border-rule"
            />
          </button>
        </div>

        {/* File upload */}
        <div className="space-y-1.5">
          <label className={LABEL_CLS}>Attached Document</label>
          <div
            className={cn(
              "relative border-2 border-dashed p-6 text-center transition-colors group cursor-pointer",
              fileError ? "border-bad/40 bg-bad/5" : "border-rule hover:border-ink hover:bg-panel"
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
                  if (invalid) { setFileError('PDFs only.'); return; }
                  const tooLarge = filesArray.find(f => f.size > 10 * 1024 * 1024);
                  if (tooLarge) { setFileError(`${tooLarge.name} exceeds 10MB.`); return; }
                  if (filesArray.length > 20) { setFileError('Max 20 files.'); return; }
                  setFiles(filesArray);
                }
              }}
            />
            {files.length > 0 ? (
              <div className="flex flex-col items-center gap-2">
                <FileIcon className="w-6 h-6 text-accent" />
                <p className="font-serif-body text-sm text-ink">{files.length} File{files.length !== 1 && 's'} Selected</p>
                <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                  {files.slice(0, 3).map(f => (
                    <span key={f.name} className="font-mono text-[10px] bg-panel px-1.5 py-0.5 border border-rule text-muted truncate max-w-[120px]">{f.name}</span>
                  ))}
                  {files.length > 3 && <span className="font-mono text-[10px] text-accent">+{files.length - 3} more</span>}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <UploadCloud className="w-6 h-6 text-muted group-hover:text-ink transition-colors" />
                <p className={cn("font-serif-body text-sm", fileError ? "text-bad" : "text-muted")}>
                  {fileError || "Drop PDFs here or click to browse"}
                </p>
                <p className="font-mono text-[10px] text-muted tracking-[0.1em]">Max 10MB per file</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-rule">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-ink text-paper font-mono text-[11px] tracking-[0.18em] uppercase transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-ink/90"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Syncing {uploadProgress.current}/{uploadProgress.total}</span>
              </div>
            ) : (
              <>
                <span>Finalize {type} Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </form>
    </motion.section>
  );
}

const LABEL_CLS = "block font-mono text-[11px] text-muted tracking-[0.18em] uppercase";
const INPUT_CLS = "w-full px-4 py-3 bg-panel border border-rule text-ink placeholder:text-muted/50 focus:outline-none focus:border-ink font-serif-body text-sm transition-colors";
