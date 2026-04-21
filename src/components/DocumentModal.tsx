import { useState, useEffect, useRef } from 'react';
import { X, Download, Calendar, Hash, FileCheck } from 'lucide-react';
import type { RegisterEntry } from '../types';
import { getFileLink, getSharedLink } from '../lib/dropbox';

// - [x] Modify `dropbox.ts` to improve `getSharedLink` error handling.
// - [x] Update `DocumentModal.tsx` to include native browser PDF rendering.
// - [x] STOP Automatic Downloads (Replace Temporary Link with Raw Shared Link in iframes).
// - [/] Verify Zero-Download PDF preview (No browser download trigger).
// - [/] Add auto-download fix to task list.

declare global {
  interface Window {
    Dropbox?: {
      embed: (options: { link: string }, container: HTMLElement) => void;
    };
  }
}

interface DocumentModalProps {
  entry: RegisterEntry;
  onClose: () => void;
}

export default function DocumentModal({ entry, onClose }: DocumentModalProps) {
  const [activeAttachmentIndex, setActiveAttachmentIndex] = useState(0);
  const [fileLink, setFileLink] = useState<string | null>(null);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const embedRef = useRef<HTMLDivElement>(null);
  const hasAttachment = entry.attachments && entry.attachments.length > 0;

  useEffect(() => {
    if (hasAttachment) {
      const fetchLink = async () => {
        setLoading(true);
        const attachment = entry.attachments[activeAttachmentIndex];
        const fileId = attachment.id;
        
        try {
          // Fetch remote-only links - NO BLOBS/DOWNLOADS to browser memory
          const [link, shared] = await Promise.all([
            getFileLink(fileId),
            getSharedLink(fileId)
          ]);
          setFileLink(link);
          setSharedUrl(shared);
        } catch (err) {
          console.error("Error fetching preview link", err);
        } finally {
          setLoading(false);
        }
      };
      fetchLink();
    }
  }, [entry, activeAttachmentIndex, hasAttachment]);

  // Handle Official Dropbox Zero-Download Embedder
  useEffect(() => {
    if (sharedUrl && embedRef.current && window.Dropbox) {
      // Clear existing content
      embedRef.current.innerHTML = "";
      
      // Streaming Preview: Document stays in the cloud
      window.Dropbox.embed(
        { link: sharedUrl },
        embedRef.current
      );
    }
  }, [sharedUrl]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-none md:rounded-3xl shadow-2xl w-full md:max-w-7xl h-[100dvh] md:h-[92vh] flex flex-col overflow-hidden outline-none animate-in fade-in zoom-in-95 slide-in-from-bottom-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
               <FileCheck className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">Zero-Download Stream</h2>
               <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 italic">Official Dropbox Cloud Preview</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            {fileLink && (
              <a 
                href={sharedUrl || fileLink} 
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-100"
              >
                <Download className="w-4 h-4" />
                Original
              </a>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700">
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Multi-Attachment Selector */}
        {entry.attachments.length > 1 && (
          <div className="bg-white border-b border-slate-100 px-6 py-2 overflow-x-auto flex gap-2 no-scrollbar">
            {entry.attachments.map((att, idx) => (
              <button
                key={att.id + idx}
                onClick={() => setActiveAttachmentIndex(idx)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeAttachmentIndex === idx ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {idx + 1}. {att.name}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Metadata Panel */}
          <div className="w-full md:w-80 lg:w-96 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100 bg-white max-h-[30vh] md:max-h-none shrink-0 scrollbar-hide">
             <h3 className="text-lg font-bold text-slate-900 mb-6 leading-tight">{entry.type === 'orders' ? `Subject: ${entry.subject}` : `Ref: ${entry.referenceNumber}`}</h3>
             <div className="grid grid-cols-1 gap-6">
                <MetaItem icon={<Calendar className="w-4 h-4" />} label="Date Registered" value={entry.date} />
                <MetaItem icon={<Hash className="w-4 h-4" />} label={entry.type === 'orders' ? 'Subject' : 'Project'} value={entry.type === 'orders' ? entry.subject : (entry.project || '—')} />
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">{entry.type === 'inward' ? 'From' : entry.type === 'outward' ? 'To' : 'Source'}</p>
                  <p className="text-base text-slate-800 font-medium leading-relaxed">{entry.partyName.replace(/\|\|\|/g, ', ')}</p>
                </div>
             </div>
          </div>

          <div className="flex-1 bg-slate-50 flex flex-col relative overflow-hidden">
             {!hasAttachment ? (
               <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-in fade-in zoom-in-95">
                 <p className="text-lg font-semibold text-slate-600">No Attachment</p>
                 <p className="text-sm text-slate-400">This record has no linked documents.</p>
               </div>
             ) : loading ? (
               <div className="flex flex-col items-center justify-center h-full gap-5">
                 <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
                 <p className="text-sm font-bold text-slate-700 uppercase tracking-widest animate-pulse">Requesting Stream...</p>
               </div>
             ) : (
                 <div className="w-full h-full db-embed-container bg-white relative">
                    {/* Mode 1: PDF Native Browser Rendering (Zero-Download Inline) */}
                    {entry.attachments[activeAttachmentIndex].name.toLowerCase().endsWith('.pdf') && sharedUrl ? (
                      <iframe 
                        src={`${sharedUrl.replace('dl=0', 'raw=1')}`}
                        className="w-full h-full border-none"
                        title="PDF Preview"
                      />
                    ) : sharedUrl && window.Dropbox ? (
                      /* Mode 2: Cloud Streaming for Office Docs (Requires sharing.write) */
                      <div ref={embedRef} className="w-full h-full" />
                    ) : (
                      /* Mode 3: Fallback if Stream Fails */
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mb-2 mx-auto">
                              <X className="w-10 h-10" />
                          </div>
                          <p className="text-lg font-bold text-slate-800">Preview Unavailable</p>
                          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                            This file type requires <b>sharing.write</b> permissions to stream from the cloud. 
                            Please update your Dropbox app scopes.
                          </p>
                          <a 
                            href={fileLink || '#'} 
                            className="mt-2 flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                          >
                            <Download className="w-4 h-4" />
                            Download instead
                          </a>
                      </div>
                    )}
                 </div>
             )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .db-embed-container iframe { width: 100% !important; height: 100% !important; border: none !important; }
      `}} />
    </div>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-0.5 text-slate-400 shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-0.5 uppercase tracking-wide">{label}</p>
        <p className="text-sm md:text-base text-slate-700 font-bold whitespace-pre-wrap">{value}</p>
      </div>
    </div>
  )
}
