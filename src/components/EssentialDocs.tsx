import { useState } from 'react';
import { Files, Upload, Trash2, Eye, Download, Search, Loader2, Plus, Calendar as CalendarIcon, AlignLeft, X, Wrench, FileCheck } from 'lucide-react';
import { addRegisterEntry, deleteRegisterEntry, uploadAttachment, getFileLink } from '../lib/dropbox';
import type { RegisterEntry, AttachmentsData } from '../types';
import DocumentModal from './DocumentModal';

export default function EssentialDocs({ data, onRefresh }: { data: RegisterEntry[], onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewDoc, setViewDoc] = useState<RegisterEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      alert('Please select at least one file.');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = selectedFiles.map(file => uploadAttachment(file));
      const uploadedFiles = await Promise.all(uploadPromises);
      
      const attachments: AttachmentsData[] = uploadedFiles
        .filter((f): f is { id: string, name: string } => f !== null)
        .map(f => ({ id: f.id, name: f.name }));

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
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const filtered = data.filter(d => d.subject.toLowerCase().includes(search.toLowerCase()) || d.remarks.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Essential Tools / Docs</h2>
          <p className="text-slate-500 text-sm">Centralized repository for office tools, resources, and important documents.</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-200 transition-all font-bold active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Tools / Docs
        </button>
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => !uploading && setShowAddModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Add Essential Resources</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                disabled={uploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Title / Subject</label>
                <input 
                  required
                  placeholder="e.g. Leave Application Form or PDF Merger Tool"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date</label>
                  <div className="relative">
                    <CalendarIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="date"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Attachments (Any File)</label>
                  <label className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${selectedFiles.length > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30'}`}>
                    <Upload className="w-4 h-4" />
                    <span className="text-xs font-bold truncate max-w-[120px]">
                      {selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Choose Files'}
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Description / Remarks</label>
                <div className="relative">
                  <AlignLeft className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
                  <textarea 
                    rows={3}
                    placeholder="Provide details or instructions for these resources..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                    value={formData.remarks}
                    onChange={e => setFormData({...formData, remarks: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={uploading || selectedFiles.length === 0}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5 group-hover:bounce" />}
                {uploading ? 'Uploading & Syncing...' : `Save ${selectedFiles.length > 1 ? 'Files' : 'File'} to Dropbox`}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <Wrench className="w-5 h-5 text-indigo-500" />
            <span>Resources Library</span>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              placeholder="Search resources..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Files className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No resources found. Add one to get started!</p>
            </div>
          ) : (
            filtered.map(doc => (
              <div key={doc.id} className="group p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    {doc.attachments.length > 1 ? <Files className="w-6 h-6 text-indigo-500" /> : <Wrench className="w-6 h-6 text-indigo-500" />}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={async () => {
                        const link = await getFileLink(doc.attachments[0].id);
                        if (link) window.open(link, '_blank');
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600"
                      title="Download First Attachment"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewDoc(doc)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-sky-600"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm('Delete this resource?')) {
                          await deleteRegisterEntry(doc.id, 'essential-docs');
                          onRefresh();
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">{doc.subject}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-medium">
                    <span>{doc.date}</span>
                    <span>•</span>
                    <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md">{doc.attachments.length} {doc.attachments.length === 1 ? 'File' : 'Files'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {viewDoc && (
        <DocumentModal 
          entry={viewDoc} 
          onClose={() => setViewDoc(null)} 
        />
      )}
    </div>
  );
}
