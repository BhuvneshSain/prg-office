import { useState, useEffect } from 'react';
import { X, Download, FileText, Calendar, AlignLeft, Hash, Loader2 } from 'lucide-react';
import type { RegisterEntry } from '../types';
import { getFileLink, getFileBlobUrl } from '../lib/dropbox';

interface DocumentModalProps {
  entry: RegisterEntry;
  onClose: () => void;
}

export default function DocumentModal({ entry, onClose }: DocumentModalProps) {
  const [activeAttachmentIndex, setActiveAttachmentIndex] = useState(0);
  const [fileLink, setFileLink] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'pdf'>('pdf');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper to detect file type from name
  const getFileType = (name: string): 'image' | 'video' | 'pdf' => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
    return 'pdf'; // Default to pdf (iframe viewer)
  };

  useEffect(() => {
    // Only fetch link if there's an attachment
    if (entry.attachments && entry.attachments.length > 0) {
      const fetchLink = async () => {
        setLoadingLink(true);
        setIframeLoaded(false); // Reset loader for new attachment
        const attachment = entry.attachments[activeAttachmentIndex];
        const type = getFileType(attachment.name);
        setFileType(type);
        
        const fileId = attachment.id;
        
        // Fetch both in parallel. 
        // 1. Download Link (for the button)
        // 2. Blob URL (for the viewer)
        const [link, blob] = await Promise.all([
          getFileLink(fileId),
          getFileBlobUrl(fileId)
        ]);
        
        setFileLink(link);
        if (blob) {
          // Add fragment for PDF viewer if it's a PDF
          setBlobUrl(type === 'pdf' ? blob + '#view=FitH&toolbar=0' : blob);
        } else {
          setBlobUrl(null);
        }
        
        setLoadingLink(false);
      };
      fetchLink();
    }
  }, [entry, activeAttachmentIndex]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
      // Cleanup Blob URL to prevent memory leaks
      if (blobUrl) {
         URL.revokeObjectURL(blobUrl.split('#')[0]); // Strip fragments before revoking
      }
    };
  }, [blobUrl]);

  const hasAttachment = entry.attachments && entry.attachments.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-none md:rounded-3xl shadow-2xl w-full md:max-w-6xl h-[100dvh] md:h-[90vh] flex flex-col overflow-hidden outline-none animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-xl ${
               entry.type === 'inward' ? 'bg-blue-100 text-blue-600' : 
               entry.type === 'outward' ? 'bg-emerald-100 text-emerald-600' : 
               'bg-amber-100 text-amber-600'
             }`}>
               <FileText className="w-5 h-5" />
             </div>
             <div>
               <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">Document Details</h2>
               <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">{entry.type} Record</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            {fileLink && (
              <a 
                href={fileLink} 
                target="_blank" 
                rel="noreferrer"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  isMobile 
                    ? 'text-white bg-indigo-600 hover:bg-indigo-700' 
                    : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                }`}
              >
                <Download className="w-4 h-4" />
                <span className="hidden min-[400px]:inline">{fileType === 'pdf' ? 'Open' : 'Download'} {entry.attachments.length > 1 ? 'Selected' : ''}</span>
              </a>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Multi-Attachment Selector Bar (Optional) */}
        {entry.attachments.length > 1 && (
          <div className="bg-white border-b border-slate-100 px-6 py-2 overflow-x-auto flex gap-2 no-scrollbar">
            {entry.attachments.map((att, idx) => (
              <button
                key={att.id}
                onClick={() => setActiveAttachmentIndex(idx)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeAttachmentIndex === idx 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 scale-105' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                File {idx + 1}: {att.name}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Left Metadata Panel */}
          <div className="w-full md:w-1/3 lg:w-1/4 p-6 overflow-y-auto border-r border-slate-100 bg-white">
             <h3 className="text-xl font-bold text-slate-900 mb-6 leading-snug">{entry.type === 'orders' ? `Subject: ${entry.subject}` : `Dispatch No: ${entry.referenceNumber}`}</h3>
             
             <div className="space-y-6">
                <MetaItem icon={<Calendar className="w-4 h-4" />} label="Date Registered" value={entry.date} />
                 <MetaItem icon={<Hash className="w-4 h-4" />} label={entry.type === 'orders' ? 'Subject' : 'Project'} value={entry.type === 'orders' ? entry.subject : (entry.project || '—')} />
                
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                    {entry.type === 'inward' ? 'Sender Dept' : entry.type === 'outward' ? 'Recipient Dept' : 'Project'}
                  </p>
                  <p className="text-slate-800 font-medium">{entry.partyName.replace(/\|\|\|/g, ', ')}</p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                    <AlignLeft className="w-4 h-4 text-slate-400" /> RajKaj Ref. No.
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed bg-white/50 whitespace-pre-wrap">
                    {entry.remarks || <span className="text-slate-400 italic">None</span>}
                  </p>
                </div>

                {/* Mobile Selector within metadata for better discoverability on small screens */}
                {entry.attachments.length > 1 && (
                  <div className="md:hidden pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Select Attachment</p>
                    <div className="space-y-2">
                      {entry.attachments.map((att, idx) => (
                        <button
                          key={att.id + idx}
                          onClick={() => setActiveAttachmentIndex(idx)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            activeAttachmentIndex === idx ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-600 border border-transparent'
                          }`}
                        >
                          {att.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          </div>

          {/* Right Document Viewer Panel */}
          <div className="w-full md:w-2/3 lg:w-3/4 bg-slate-100/50 flex flex-col relative overflow-hidden">
             {!hasAttachment ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-in fade-in zoom-in-95">
                 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-sm">
                   <FileText className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-lg font-semibold text-slate-600">No Attachment Available</p>
                 <p className="text-sm">This record was saved without a scanned document.</p>
               </div>
             ) : loadingLink ? (
               <div className="flex flex-col items-center justify-center h-full gap-4">
                 <div className="relative">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <FileText className="w-4 h-4 text-indigo-300" />
                    </div>
                 </div>
                 <p className="text-sm font-bold text-slate-600 animate-pulse uppercase tracking-wider">Fetching secure sync...</p>
               </div>
             ) : blobUrl ? (
               <>
                 {fileType === 'pdf' && !iframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10">
                       <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                       <p className="text-sm font-medium text-slate-600">Loading document viewer...</p>
                    </div>
                 )}
                 
                 <div className="w-full h-full flex items-center justify-center p-4">
                    {fileType === 'image' ? (
                      <img 
                        src={blobUrl} 
                        alt="Attachment" 
                        className="max-w-full max-h-full object-contain rounded-xl shadow-lg ring-1 ring-slate-200 animate-in zoom-in-95 duration-500"
                      />
                    ) : fileType === 'video' ? (
                      <video 
                        controls 
                        src={blobUrl} 
                        className="max-w-full max-h-full rounded-xl shadow-2xl ring-1 ring-slate-800 animate-in zoom-in-95 duration-500"
                        autoPlay
                      />
                    ) : (
                      <div className="w-full h-full relative group">
                        {isMobile && fileType === 'pdf' ? (
                          <div className="flex flex-col items-center justify-center h-full w-full bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 ring-8 ring-indigo-50/50">
                              <FileText className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">View PDF Document</h3>
                            <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
                              Mobile browsers works best when opening PDFs in their native viewer.
                            </p>
                            <div className="flex flex-col w-full gap-3">
                              <a 
                                href={fileLink || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 active:scale-95 transition-all"
                              >
                                <FileText className="w-6 h-6" />
                                View Full Document
                              </a>
                              <a 
                                href={fileLink || '#'} 
                                download={entry.attachments[activeAttachmentIndex].name}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                Download PDF
                              </a>
                            </div>
                          </div>
                        ) : (
                          <iframe 
                            src={blobUrl} 
                            className="w-full h-full border-none bg-slate-50 rounded-xl"
                            onLoad={() => setIframeLoaded(true)}
                            title="PDF Document Preview"
                          />
                        )}
                      </div>
                    )}
                 </div>
               </>
             ) : (
               <div className="flex flex-col items-center justify-center h-full text-red-400 p-8 text-center">
                 <p className="font-semibold">Error Loading Attachment</p>
                 <p className="text-sm">Could not generate a temporary viewing link.</p>
               </div>
             )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-800 font-medium">{value}</p>
      </div>
    </div>
  )
}
