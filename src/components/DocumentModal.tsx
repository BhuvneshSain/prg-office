import { useState, useEffect } from 'react';
import { X, Download, FileText, Calendar, AlignLeft, Hash, Loader2 } from 'lucide-react';
import type { RegisterEntry } from '../types';
import { getFileLink, getFileBlobUrl } from '../lib/dropbox';

interface DocumentModalProps {
  entry: RegisterEntry;
  onClose: () => void;
}

export default function DocumentModal({ entry, onClose }: DocumentModalProps) {
  const [fileLink, setFileLink] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);

  useEffect(() => {
    // Only fetch link if there's an attachment
    if (entry.attachments && entry.attachments.length > 0) {
      const fetchLink = async () => {
        setLoadingLink(true);
        const fileId = entry.attachments[0].id;
        
        // Fetch both in parallel. 
        // 1. Download Link (for the button)
        // 2. Blob URL (for the iframe viewer)
        const [link, blob] = await Promise.all([
          getFileLink(fileId),
          getFileBlobUrl(fileId)
        ]);
        
        setFileLink(link);
        if (blob) {
          setBlobUrl(blob + '#view=FitH&toolbar=0');
        }
        
        setLoadingLink(false);
      };
      fetchLink();
    }
  }, [entry]);

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
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Original
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
                 <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                 <p className="text-sm font-medium text-slate-600 animate-pulse">Retrieving secure link from Dropbox...</p>
               </div>
             ) : blobUrl ? (
               <>
                 {!iframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10">
                       <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                       <p className="text-sm font-medium text-slate-600">Loading document viewer...</p>
                    </div>
                 )}
                 {/* Secure iframe embedding of PDF */}
                 <iframe 
                   src={blobUrl} 
                   className="w-full h-full border-none bg-slate-50"
                   onLoad={() => setIframeLoaded(true)}
                   title="PDF Document Preview"
                 />
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
