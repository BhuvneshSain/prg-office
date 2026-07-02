import React, { useState, memo } from 'react';
import { Files, Upload, Trash2, Search, Loader2, Plus, X, Wrench, FileCheck, Edit, Sparkles, FolderDown, ArrowRight, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addRegisterEntry, deleteRegisterEntry } from '../lib/dataService';
import { batchUploadAttachments } from '../lib/fileService';
import type { RegisterEntry } from '../types';
import DocumentModal from './DocumentModal';
import EditModal from './EditModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INPUT_CLS = "w-full px-4 py-3 bg-panel border border-rule text-ink placeholder:text-muted/50 font-serif-body text-sm focus:outline-none focus:border-ink transition-colors";
const LABEL_CLS = "block font-mono text-[11px] text-muted tracking-[0.18em] uppercase";

const EssentialDocs = memo(function EssentialDocs({ data, onRefresh, departments = [], projects = [] }: { data: RegisterEntry[], onRefresh: () => void, departments?: string[], projects?: string[] }) {
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewDoc, setViewDoc] = useState<RegisterEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ subject: '', date: new Date().toISOString().split('T')[0], remarks: '' });
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [editingDoc, setEditingDoc] = useState<RegisterEntry | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });
    try {
      const attachments = await batchUploadAttachments(selectedFiles, (curr: number, tot: number) => {
        setUploadProgress({ current: curr, total: tot });
      });
      if (attachments.length === 0) throw new Error('Upload failed');
      const entry: RegisterEntry = {
        id: Date.now().toString(), type: 'essential-docs', date: formData.date,
        partyName: 'Office', subject: formData.subject || (selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} Files`),
        referenceNumber: 'ETD-' + Date.now().toString().slice(-6),
        remarks: formData.remarks || 'Essential Tools & Documents', attachments,
      };
      await addRegisterEntry(entry);
      onRefresh();
      setShowAddModal(false);
      setFormData({ subject: '', date: new Date().toISOString().split('T')[0], remarks: '' });
      setSelectedFiles([]);
    } catch { alert('Upload failed.'); }
    finally { setUploading(false); setUploadProgress({ current: 0, total: 0 }); }
  };

  const filtered = data.filter(d =>
    d.subject.toLowerCase().includes(search.toLowerCase()) ||
    d.remarks.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-muted" />
            <p className="font-mono text-[10px] text-muted tracking-[0.18em] uppercase">Resources</p>
          </div>
          <h2 className="font-serif-display italic text-3xl leading-none">Resources Library</h2>
          <p className="font-serif-body text-muted text-sm mt-2 max-w-md hidden sm:block">Centralized access to office tools and essential documents.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-ink text-paper font-mono text-[11px] tracking-[0.18em] uppercase hover:bg-ink/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Deposit Resource
        </button>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/20"
              onClick={() => !uploading && setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              className="relative bg-paper w-full max-w-lg border border-rule overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-rule flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <FolderDown className="w-4 h-4 text-muted" />
                  <div>
                    <h3 className="font-serif-display italic text-base">Add Resource</h3>
                    <p className="font-mono text-[10px] text-muted tracking-[0.14em] uppercase">Document upload</p>
                  </div>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1.5 text-muted hover:text-bad transition-colors" disabled={uploading}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className={LABEL_CLS}>Resource Title</label>
                  <input required placeholder="e.g. Leave Policy v2.0" className={INPUT_CLS} value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className={LABEL_CLS}>Date</label>
                    <input type="date" required className={INPUT_CLS} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={LABEL_CLS}>Files</label>
                    <label className={cn(
                      "flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed cursor-pointer transition-colors",
                      selectedFiles.length > 0 ? "border-good/40 bg-good/5 text-good" : "border-rule hover:border-ink"
                    )}>
                      <Upload className="w-4 h-4" />
                      <span className="font-mono text-[10px] tracking-[0.12em] uppercase truncate max-w-[100px]">
                        {selectedFiles.length > 0 ? `${selectedFiles.length} Loaded` : 'Choose Files'}
                      </span>
                      <input type="file" multiple className="hidden" onChange={e => { const files = Array.from(e.target.files || []); if (files.length > 0) setSelectedFiles(files); }} />
                    </label>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={LABEL_CLS}>Description</label>
                  <textarea rows={3} placeholder="Contextual details..." className={cn(INPUT_CLS, "resize-none")} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
                </div>
                <button
                  type="submit" disabled={uploading || selectedFiles.length === 0}
                  className="w-full py-3.5 bg-ink text-paper font-mono text-[11px] tracking-[0.18em] uppercase flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-ink/90 transition-colors"
                >
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Syncing {uploadProgress.current}/{uploadProgress.total}</span>
                    </div>
                  ) : (
                    <><FileCheck className="w-4 h-4" /> Commit to Dropbox</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="border border-rule overflow-hidden">
        <div className="p-5 border-b border-rule flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-serif-display italic text-lg flex items-center gap-2">
              <Files className="w-4 h-4 text-muted" /> Essential Hub
            </h3>
            <p className="font-mono text-[10px] text-muted tracking-[0.14em] uppercase mt-1">Central knowledge base</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text" placeholder="Search resources..."
              className="w-full pl-9 pr-3 py-2 bg-panel border border-rule text-[11px] font-mono placeholder:text-muted/50 focus:outline-none focus:border-ink transition-colors"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {filtered.length === 0 ? (
            <div className="col-span-full py-16 flex flex-col items-center text-center">
              <Files className="w-8 h-8 text-muted opacity-30 mb-3" />
              <h4 className="font-serif-display italic text-base">Archive Empty</h4>
              <p className="font-serif-body text-muted text-sm mt-1">No documents in this sector.</p>
            </div>
          ) : (
            filtered.map((doc, idx) => (
              <motion.div
                key={doc.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="group border border-rule p-5 hover:border-ink transition-colors flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 border border-rule flex items-center justify-center group-hover:bg-ink group-hover:text-paper transition-colors">
                    {doc.attachments.length > 1 ? <Files className="w-5 h-5 text-muted group-hover:text-paper transition-colors" /> : <Wrench className="w-5 h-5 text-muted group-hover:text-paper transition-colors" />}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setViewDoc(doc)} className="p-1.5 text-muted hover:text-ink transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingDoc(doc)} className="p-1.5 text-muted hover:text-ink transition-colors" title="Edit"><Edit className="w-3.5 h-3.5" /></button>
                    <button onClick={async (e) => { e.stopPropagation(); if (confirm('Delete this resource?')) { await deleteRegisterEntry(doc.id, 'essential-docs'); onRefresh(); } }} className="p-1.5 text-muted hover:text-bad transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-mono text-[10px] text-muted tracking-[0.12em] uppercase mb-1">{doc.date}</p>
                  <h4 className="font-serif-display text-base leading-tight group-hover:text-accent transition-colors">{doc.subject}</h4>
                  <p className="font-serif-body text-xs text-muted mt-1.5 line-clamp-2">{doc.remarks}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-rule flex items-center justify-between">
                  <span className="font-mono text-[10px] text-accent tracking-[0.1em] uppercase">
                    {doc.attachments.length} file{doc.attachments.length !== 1 && 's'}
                  </span>
                  <button onClick={() => setViewDoc(doc)} className="font-mono text-[10px] text-muted hover:text-ink tracking-[0.1em] uppercase flex items-center gap-1 transition-colors">
                    View <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {viewDoc && <DocumentModal entry={viewDoc} onClose={() => setViewDoc(null)} />}
        {editingDoc && <EditModal entry={editingDoc} departments={departments} projects={projects} onClose={() => setEditingDoc(null)} onSuccess={() => { onRefresh(); setEditingDoc(null); }} />}
      </AnimatePresence>
    </div>
  );
});

export default EssentialDocs;
