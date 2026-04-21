import { useState, useEffect, useRef } from 'react';
import { X, Download, Calendar, Hash, FileCheck, Loader2, FileText } from 'lucide-react';
import type { RegisterEntry } from '../types';
import { getFileLink, getSharedLink } from '../lib/dropbox';

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
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const embedRef = useRef<HTMLDivElement>(null);
  const hasAttachment = entry.attachments && entry.attachments.length > 0;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getFileType = (name: string): 'image' | 'video' | 'pdf' | 'other' => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) return 'video';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  };

  const currentFile = hasAttachment ? entry.attachments[activeAttachmentIndex] : null;
  const fileType = currentFile ? getFileType(currentFile.name) : 'other';

  useEffect(() => {
    if (hasAttachment) {
      const fetchLink = async () => {
        setLoading(true);
        setIframeLoaded(false);
        const attachment = entry.attachments[activeAttachmentIndex];
        const fileId = attachment.id;
        
        try {
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

  useEffect(() => {
    if (sharedUrl && embedRef.current && window.Dropbox && fileType === 'other') {
      embedRef.current.innerHTML = "";
      window.Dropbox.embed({ link: sharedUrl }, embedRef.current);
    }
  }, [sharedUrl, fileType]);

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
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
               <FileCheck className="w-6 h-6" />
             </div>
             <div>
               <h2 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">Document Preview</h2>
               <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 italic">Official Dropbox Cloud Preview</p>
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
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700">
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

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

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
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
               <div className="w-full h-full db-embed-container bg-white relative flex items-center justify-center">
                 {fileType === 'pdf' && sharedUrl ? (
                    isMobile ? (
                      <div className="flex flex-col items-center justify-center h-full w-full bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6 ring-8 ring-indigo-50/50">
                          <FileText className="w-10 h-10 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">View PDF Document</h3>
                        <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
                          Mobile browsers work best when opening PDFs in their native viewer.
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
                        </div>
                      </div>
                    ) : (
                      <>
                        {!iframeLoaded && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                            <p className="text-sm font-medium text-slate-600">Loading document viewer...</p>
                          </div>
                        )}
                        <iframe 
                          src={`${sharedUrl.replace('dl=0', 'raw=1')}`}
                          className="w-full h-full border-none"
                          onLoad={() => setIframeLoaded(true)}
                          title="PDF Preview"
                        />
                      </>
                    )
                 ) : fileType === 'image' && fileLink ? (
                    <img 
                      src={fileLink} 
                      alt="Attachment" 
                      className="max-w-full max-h-full object-contain rounded-xl shadow-lg ring-1 ring-slate-200 animate-in zoom-in-95 duration-500"
                    />
                 ) : fileType === 'video' && fileLink ? (
                    <video 
                      controls 
                      src={fileLink} 
                      className="max-w-full max-h-full rounded-xl shadow-2xl ring-1 ring-slate-800 animate-in zoom-in-95 duration-500"
                      autoPlay
                    />
                 ) : sharedUrl && window.Dropbox ? (
                   <div ref={embedRef} className="w-full h-full" />
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                       <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mb-2 mx-auto">
                           <X className="w-10 h-10" />
                       </div>
                       <p className="text-lg font-bold text-slate-800">Preview Unavailable</p>
                       <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                         This file type requires specific permissions to stream from the cloud. 
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
