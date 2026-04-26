import React, { useState, memo } from 'react';
import { Files, Upload, Trash2, Download, Search, Loader2, Plus, Calendar as CalendarIcon, AlignLeft, X, Wrench, FileCheck, Edit, Sparkles, FolderDown, ArrowRight, FileSpreadsheet, FileDown } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { addRegisterEntry, deleteRegisterEntry } from '../lib/dataService';
import { batchUploadAttachments, getFileLink } from '../lib/fileService';
import type { RegisterEntry } from '../types';
import DocumentModal from './DocumentModal';
import EditModal from './EditModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EssentialDocs = memo(function EssentialDocs({ data, onRefresh, departments = [], projects = [] }: { data: RegisterEntry[], onRefresh: () => void, departments?: string[], projects?: string[] }) {
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewDoc, setViewDoc] = useState<RegisterEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });
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
        id: Date.now().toString(),
        type: 'essential-docs',
        date: formData.date,
        partyName: 'Office',
        subject: formData.subject || (selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} Files`),
        referenceNumber: 'ETD-' + Date.now().toString().slice(-6),
        remarks: formData.remarks || 'Essential Tools & Documents',
        attachments: attachments,
      };

      await addRegisterEntry(entry);
      onRefresh();
      setShowAddModal(false);
      setFormData({ subject: '', date: new Date().toISOString().split('T')[0], remarks: '' });
      setSelectedFiles([]);
    } catch {
      alert('Security Protocol Failure: Synchronization interrupted.');
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  const filtered = data.filter(d => 
    d.subject.toLowerCase().includes(search.toLowerCase()) || 
    d.remarks.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-cyber-violet" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Vault Assets</p>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight leading-none">Resources Library</h2>
          <p className="text-slate-400 text-sm font-bold mt-3 max-w-md hidden sm:block">Secure, centralized access to office tools, mission-critical documents, and personnel resources.</p>
        </div>
        
        <motion.button 
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[24px] shadow-xl shadow-slate-900/10 transition-all font-black text-xs uppercase tracking-widest relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-cyber-violet opacity-0 group-hover:opacity-10 transition-opacity" />
          <Plus className="w-5 h-5" />
          Deposit Resource
        </motion.button>
      </div>

      {/* Add Document Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" 
              onClick={() => !uploading && setShowAddModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative bg-white/70 backdrop-blur-3xl w-full max-w-lg rounded-[40px] shadow-glass border border-white/60 overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-white/40 flex justify-between items-center bg-white/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyber-violet/10 flex items-center justify-center">
                    <FolderDown className="w-5 h-5 text-cyber-violet" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 tracking-tight">Add Resource</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Document Uplink</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                  disabled={uploading}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <form onSubmit={handleUpload} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Resource Title</label>
                  <input 
                    required
                    placeholder="e.g. Leave Policy v2.0"
                    className="w-full px-5 py-3.5 bg-white/60 border border-slate-200/60 rounded-[22px] outline-none focus:bg-white focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet transition-all font-bold text-sm text-slate-800"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Issuance Date</label>
                    <div className="relative">
                      <CalendarIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                      <input 
                        type="date"
                        required
                        className="w-full pl-11 pr-5 py-3.5 bg-white/60 border border-slate-200/60 rounded-[22px] outline-none focus:bg-white focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet transition-all font-bold text-sm text-slate-800"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Payload Terminal</label>
                    <label className={cn(
                      "flex items-center justify-center gap-2 w-full py-3.5 border-2 border-dashed rounded-[22px] cursor-pointer transition-all",
                      selectedFiles.length > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-slate-200 hover:border-cyber-violet hover:bg-cyber-violet/[0.03]"
                    )}> 
                      <Upload className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[100px]">
                        {selectedFiles.length > 0 ? `${selectedFiles.length} Loaded` : 'Choose Files'}
                      </span>
                      <input 
                        type="file" 
                        multiple
                        className="hidden" 
                        onChange={e => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) setSelectedFiles(files);
                        }} 
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Description / Notes</label>
                  <div className="relative">
                    <AlignLeft className="w-4 h-4 absolute left-4 top-4 text-slate-300" />
                    <textarea 
                      rows={3}
                      placeholder="Contextual details..."
                      className="w-full pl-11 pr-5 py-4 bg-white/60 border border-slate-200/60 rounded-[22px] outline-none focus:bg-white focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet transition-all resize-none font-bold text-sm text-slate-800"
                      value={formData.remarks}
                      onChange={e => setFormData({...formData, remarks: e.target.value})}
                    />
                  </div>
                </div>

                <motion.button 
                  whileHover={{ y: -4, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={uploading || selectedFiles.length === 0}
                  className="w-full py-5 bg-slate-900 text-white rounded-[22px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-1">
                       <div className="flex items-center gap-3">
                         <Loader2 className="w-5 h-5 animate-spin" />
                         <span className="tracking-tight uppercase text-[10px] font-black">Syncing {uploadProgress.current}/{uploadProgress.total}</span>
                       </div>
                       <div className="w-32 h-0.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                            className="h-full bg-white"
                          />
                       </div>
                    </div>
                  ) : (
                    <>
                      <FileCheck className="w-5 h-5" />
                      Commit to Dropbox
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Grid View */}
      <motion.div 
        layout
        className="glass-card rounded-[40px] border-white/60 shadow-glass overflow-hidden"
      >
        <div className="p-5 sm:p-6 border-b border-[var(--border-primary)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--header-bg)] backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-black flex items-center gap-2 text-[var(--text-primary)] tracking-tight">
              <Files className="w-5 h-5 text-cyber-violet" /> Essential Hub
            </h3>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-cyber-violet/40" /> Central Knowledge Base
            </p>
          </div>
          
          <div className="relative group w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyber-violet transition-colors" />
            <input 
              type="text" 
              placeholder="Search resources..." 
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[18px] text-xs focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet focus:bg-[var(--bg-surface)] outline-none transition-all placeholder:text-[var(--text-muted)] font-medium text-[var(--text-primary)]"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportToExcel(data, 'essential_documents')}
                title="Export to Excel"
                className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportToPDF(data, 'Essential Documents Report', 'docs_report')}
                title="Export to PDF"
                className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors shadow-sm"
              >
                <FileDown className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
            {filtered.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-20 flex flex-col items-center justify-center text-center"
              >
                <div className="w-20 h-20 rounded-[30px] bg-[var(--bg-page)] flex items-center justify-center mb-6 border border-[var(--border-primary)]">
                  <Files className="w-10 h-10 text-[var(--text-muted)]" />
                </div>
                <h4 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Archive Empty</h4>
                <p className="text-sm text-[var(--text-muted)] font-bold max-w-xs mt-2">No documents detected in this sector. Initialise a deposit.</p>
              </motion.div>
            ) : (
              filtered.map((doc, idx) => (
                <motion.div 
                  key={doc.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative p-6 bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-[32px] hover:bg-[var(--bg-surface)] hover:shadow-2xl hover:shadow-cyber-violet/5 transition-all duration-300 h-full flex flex-col"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] shadow-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-cyber-violet transition-all duration-300 border border-[var(--border-primary)]">
                      {doc.attachments.length > 1 ? (
                        <Files className="w-7 h-7 text-cyber-violet group-hover:text-white transition-colors" />
                      ) : (
                        <Wrench className="w-7 h-7 text-cyber-violet group-hover:text-white transition-colors" />
                      )}
                    </div>
                    
                    <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all translate-x-0 md:translate-x-2 md:group-hover:translate-x-0">
                      <ActionBtn 
                        id={`view-${doc.id}`}
                        icon={doc.attachments.length > 1 ? <Files className="w-4 h-4" /> : <Download className="w-4 h-4" />} 
                        label={doc.attachments.length > 1 ? "Inspect Files" : "Download Payload"} 
                        onClick={async () => {
                          if (doc.attachments.length > 1) {
                            setViewDoc(doc);
                          } else {
                            const link = await getFileLink(doc.attachments[0].id);
                            if (link) window.open(link, '_blank');
                          }
                        }} 
                        color="sky" 
                      />

                      <ActionBtn 
                        id={`edit-${doc.id}`}
                        icon={<Edit className="w-4 h-4" />} 
                        label="Modify" 
                        onClick={() => setEditingDoc(doc)} 
                        color="amber" 
                      />

                      <ActionBtn 
                        id={`delete-${doc.id}`}
                        icon={<Trash2 className="w-4 h-4" />} 
                        label="Archive" 
                        onClick={async (e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (confirm('Permanently purge this resource?')) {
                            await deleteRegisterEntry(doc.id, 'essential-docs');
                            onRefresh();
                          }
                        }} 
                        color="red" 
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{doc.date}</span>
                    </div>
                    <h4 className="text-lg font-black text-[var(--text-primary)] leading-tight group-hover:text-cyber-violet transition-colors">{doc.subject}</h4>
                    <p className="text-xs text-[var(--text-muted)] font-bold mt-2 line-clamp-2 leading-relaxed">{doc.remarks}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--border-primary)] flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyber-violet bg-cyber-violet/5 px-2 py-1 rounded-md">
                      {doc.attachments.length} Payload{doc.attachments.length !== 1 && 's'}
                    </span>
                    <button 
                      onClick={() => setViewDoc(doc)}
                      className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
                    >
                      Inspect <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
        </div>
      </motion.div>

      {/* Detail Overlays */}
      <AnimatePresence>
        {viewDoc && (
          <DocumentModal 
            entry={viewDoc} 
            onClose={() => setViewDoc(null)} 
          />
        )}

        {editingDoc && (
          <EditModal
            entry={editingDoc}
            departments={departments}
            projects={projects}
            onClose={() => setEditingDoc(null)}
            onSuccess={() => { onRefresh(); setEditingDoc(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default EssentialDocs;

function ActionBtn({ id, icon, label, onClick, color }: { id: string; icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; color: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-500 hover:bg-slate-200',
    violet: 'bg-cyber-violet/10 text-cyber-violet hover:bg-cyber-violet/20',
    amber: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20',
    red: 'bg-red-50 text-red-500 hover:bg-red-100',
    sky: 'bg-sky-50 text-sky-600 hover:bg-sky-100',
  };
  return (
    <motion.button 
      id={id}
      onClick={onClick} title={label} 
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={cn("w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm", colors[color])}
    >
      {icon}
    </motion.button>
  );
}