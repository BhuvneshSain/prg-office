import { useState } from 'react';
import { Files, Upload, Trash2, Eye, Download, Search, Loader2, Plus, Calendar as CalendarIcon, AlignLeft, X } from 'lucide-react';
import { addRegisterEntry, deleteRegisterEntry, uploadAttachment, getFileLink } from '../lib/dropbox';
import type { RegisterEntry } from '../types';
import DocumentModal from './DocumentModal';

export default function MyDocuments({ data, onRefresh }: { data: RegisterEntry[], onRefresh: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewDoc, setViewDoc] = useState<RegisterEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a PDF file.');
      return;
    }

    setUploading(true);
    try {
      const fileData = await uploadAttachment(selectedFile);
      if (!fileData) throw new Error('Upload failed');

      const entry: RegisterEntry = {
        id: Date.now().toString(),
        type: 'my-documents',
        date: formData.date,
        partyName: 'Me',
        subject: formData.subject || selectedFile.name.replace('.pdf', ''),
        referenceNumber: 'DOC-' + Date.now().toString().slice(-6),
        remarks: formData.remarks || 'Personal Document',
        attachments: [fileData],
      };

      await addRegisterEntry(entry);
      onRefresh();
      setShowAddModal(false);
      setFormData({ subject: '', date: new Date().toISOString().split('T')[0], remarks: '' });
      setSelectedFile(null);
    } catch (err) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const filtered = data.filter(d => d.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Documents</h2>
          <p className="text-slate-500 text-sm">Upload and manage your personal PDF files securely.</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl shadow-lg shadow-violet-200 transition-all font-bold active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Document
        </button>
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => !uploading && setShowAddModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 text-violet-600 rounded-xl">
                  <Files className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">Add Personal Document</h3>
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Document Subject / Title</label>
                <input 
                  required
                  placeholder="e.g. Electricity Bill Feb 2024"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
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
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium text-slate-700"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Attachment (PDF)</label>
                  <label className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${selectedFile ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-violet-300 hover:bg-violet-50/30'}`}>
                    <Upload className="w-4 h-4" />
                    <span className="text-xs font-bold truncate max-w-[120px]">{selectedFile ? selectedFile.name : 'Choose File'}</span>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      className="hidden" 
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file && file.type === 'application/pdf') setSelectedFile(file);
                        else if (file) alert('Please select a PDF file.');
                      }} 
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Remarks / Detail</label>
                <div className="relative">
                  <AlignLeft className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
                  <textarea 
                    rows={3}
                    placeholder="Add additional notes or details about this document..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none"
                    value={formData.remarks}
                    onChange={e => setFormData({...formData, remarks: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-violet-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 group-hover:bounce" />}
                {uploading ? 'Processing & Syncing...' : 'Save Document to Dropbox'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <Files className="w-5 h-5 text-violet-500" />
            <span>Document Library</span>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              placeholder="Search documents..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Files className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No documents found. Start by uploading one!</p>
            </div>
          ) : (
            filtered.map(doc => (
              <div key={doc.id} className="group p-4 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <Files className="w-6 h-6 text-violet-500" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={async () => {
                        const link = await getFileLink(doc.attachments[0].id);
                        if (link) window.open(link, '_blank');
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-violet-600"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewDoc(doc)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-sky-600"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={async () => {
                        if (confirm('Delete this document?')) {
                          await deleteRegisterEntry(doc.id, 'my-documents');
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
                  <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-violet-600 transition-colors">{doc.subject}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-medium">
                    <span>{doc.date}</span>
                    <span>•</span>
                    <span>{doc.referenceNumber}</span>
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
