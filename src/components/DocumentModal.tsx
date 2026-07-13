import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Calendar, FileCheck, Loader2, FileText, Sparkles, LayoutGrid, Share2, Globe, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RegisterEntry } from '../types';
import { formatDate } from '../utils/dateUtils';
import { getFileLink, getSharedLink } from '../lib/fileService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
      let active = true;
      const fetchLink = async () => {
        setLoading(true);
        setIframeLoaded(false);
        const attachment = entry.attachments[activeAttachmentIndex];
        if (!attachment) {
          setLoading(false);
          return;
        }
        const fileId = attachment.id;
        
        try {
          const [link, shared] = await Promise.all([
            getFileLink(fileId),
            getSharedLink(fileId)
          ]);
          if (active) {
            setFileLink(link);
            setSharedUrl(shared);
          }
        } catch (err) {
          console.error("Error fetching preview link", err);
        } finally {
          if (active) setLoading(false);
        }
      };
      fetchLink();
      return () => { active = false; };
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-8">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ink/20"
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 40 }}
        transition={{ duration: 0.3 }}
        className="relative bg-paper border-none md:border border-rule w-full md:max-w-[85vw] h-full md:h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--header-bg)] shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/10 flex items-center justify-center shrink-0 border border-accent/10">
                <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-serif-display text-[var(--text-primary)] tracking-tight leading-tight truncate">Asset Inspection</h2>
                <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5 sm:mt-1">
                  <Globe className="w-2.5 h-2.5" /> <span className="truncate">Dropbox Secure Preview</span>
                </p>
             </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {fileLink && (
              <motion.a 
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={fileLink} 
                target="_blank" 
                rel="noreferrer"
                className="hidden sm:flex items-center gap-3 px-6 py-3.5 bg-ink text-paper font-mono text-[11px] tracking-[0.18em] uppercase"
              >
                <Download className="w-4 h-4" />
                {fileType === 'pdf' ? 'Extract PDF' : 'Download'}
              </motion.a>
            )}
            <motion.button 
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose} 
              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-[var(--bg-page)] text-[var(--text-muted)] border border-rule"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
          </div>
        </div>

        {/* Attachment Tabs (Multi-file) */}
        {entry.attachments.length > 1 && (
          <div className="bg-[var(--header-bg)] border-b border-[var(--border-primary)] px-4 sm:px-8 py-2.5 sm:py-3 overflow-x-auto flex gap-2 sm:gap-3 no-scrollbar shrink-0">
            {entry.attachments.map((att, idx) => (
              <motion.button
                key={att.id + idx}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveAttachmentIndex(idx)}
                className={cn(
                  "px-4 sm:px-5 py-2 sm:py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase transition-all whitespace-nowrap",
                  activeAttachmentIndex === idx ? "bg-ink text-paper" : "bg-[var(--bg-surface)] border border-rule text-[var(--text-muted)]"
                )}
              >
                Unit {idx + 1}: {att.name}
              </motion.button>
            ))}
          </div>
        )}

        {/* Modal Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Metadata Sidebar */}
          <div className="w-full md:w-80 lg:w-96 p-5 sm:p-8 overflow-y-auto border-b md:border-b-0 md:border-r border-[var(--border-primary)] bg-[var(--header-bg)] shrink-0 custom-scrollbar">
             <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Sparkles className="w-4 h-4 text-accent" />
                <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)]">Contextual Data</p>
             </div>
             
             <h3 className="text-xl sm:text-2xl font-serif-display text-[var(--text-primary)] mb-6 sm:mb-8 tracking-tight leading-tight">
               {entry.type === 'orders' ? entry.subject : entry.referenceNumber || "ID UNSPECIFIED"}
             </h3>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-6 sm:gap-8">
                <MetaItem icon={<Calendar />} label="Log Timestamp" value={formatDate(entry.date)} />
                <MetaItem icon={<LayoutGrid />} label={entry.type === 'orders' ? 'Primary Focus' : 'Strategic Project'} value={entry.type === 'orders' ? entry.subject : (entry.project || 'Global Cluster')} />
                
                <div className="sm:col-span-2 md:col-span-1 p-5 sm:p-6 bg-[var(--bg-surface)] border border-rule relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 text-[var(--border-primary)] group-hover:text-accent/20 transition-colors">
                    <Share2 className="w-8 h-8" />
                  </div>
                  <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)] mb-2 relative z-10">{entry.type === 'inward' ? 'Origin Point' : entry.type === 'outward' ? 'Target Destination' : 'Source Authority'}</p>
                  <p className="text-base sm:text-lg text-[var(--text-primary)] font-serif-body leading-tight tracking-tight relative z-10">{entry.partyName.replace(/\|\|\|/g, ', ')}</p>
                </div>

                {entry.remarks && (
                   <div className="sm:col-span-2 md:col-span-1 space-y-2">
                     <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)] ml-1">Annotations</p>
                     <div className="p-4 sm:p-5 bg-[var(--bg-page)] border border-rule">
                        <p className="text-xs font-serif-body text-[var(--text-secondary)] leading-relaxed italic">"{entry.remarks}"</p>
                     </div>
                   </div>
                )}
             </div>
          </div>

          {/* Preview Viewport */}
          <div className="flex-1 bg-[var(--bg-page)] flex flex-col relative overflow-y-auto custom-scrollbar">
             {!hasAttachment ? (
               <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] p-8 text-center animate-in fade-in zoom-in-95">
                 <div className="w-24 h-24 bg-[var(--bg-surface)] flex items-center justify-center mb-6 border border-rule">
                    <FileText className="w-10 h-10 opacity-20" />
                 </div>
                 <h3 className="text-xl font-serif-display text-[var(--text-primary)] tracking-tight">Deployment Blank</h3>
                 <p className="text-sm font-serif-body text-[var(--text-muted)] mt-2">No linked assets detected for this record index.</p>
               </div>
             ) : (
               <div className="w-full h-full db-embed-container bg-paper/40 relative flex items-center justify-center">
                 {loading && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-paper/80">
                      <div className="w-16 h-16 bg-paper flex items-center justify-center mb-4">
                        <Loader2 className="w-8 h-8 text-accent animate-spin" />
                      </div>
                      <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)]">Establishing Uplink...</p>
                    </div>
                 )}

                   {fileType === 'pdf' && (sharedUrl || fileLink) ? (
                    isMobile ? (
                      <div className="flex flex-col items-center justify-center min-h-full w-full bg-[var(--bg-page)] p-6 sm:p-8 text-center">
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="w-24 h-24 bg-accent/10 flex items-center justify-center mb-8 border border-accent/10"
                        >
                          <FileText className="w-12 h-12 text-accent" />
                        </motion.div>
                        <h3 className="text-2xl font-serif-display text-[var(--text-primary)] tracking-tight mb-3">Payload Inspection</h3>
                        <p className="text-[var(--text-muted)] text-sm font-serif-body mb-10 max-w-xs mx-auto leading-relaxed">
                          Mobile security protocols require native environment execution for PDF streaming.
                        </p>
                        <motion.a
                          whileTap={{ scale: 0.95 }}
                          href={sharedUrl ? sharedUrl.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1') : fileLink || ''}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full max-w-[280px] flex items-center justify-center gap-3 px-8 py-4 sm:py-5 bg-ink text-paper font-mono text-[11px] tracking-[0.18em] uppercase mb-4"
                        >
                          Launch Viewer
                        </motion.a>
                      </div>
                    ) : (
                      <>
                        {!iframeLoaded && !loading && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-page)] z-10">
                            <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
                            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)]">Rendering Interface...</p>
                          </div>
                        )}
                        <iframe
                          src={sharedUrl ? sharedUrl.replace('?dl=0', '?raw=1').replace('&dl=0', '&raw=1') : fileLink || ''}
                          className="w-full h-full border-none bg-paper"
                          onLoad={() => setIframeLoaded(true)}
                          title="PDF Preview"
                        />
                      </>
                    )
                  ) : fileType === 'image' && fileLink ? (
                    <motion.img 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={fileLink} 
                      alt="Attachment" 
                      className="max-w-[90%] max-h-[90%] object-contain transition-all"
                    />
                 ) : fileType === 'video' && fileLink ? (
                    <video 
                      controls 
                      src={fileLink} 
                      className="max-w-[90%] max-h-[90%] bg-black"
                      autoPlay
                    />
                 ) : sharedUrl && window.Dropbox ? (
                    <div ref={embedRef} className="w-full h-full" />
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[var(--bg-page)]">
                        <div className="w-24 h-24 bg-bad/5 text-bad flex items-center justify-center mb-8 border border-bad/30">
                            <AlertOctagon className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-serif-display text-[var(--text-primary)] tracking-tight mb-3">Preview Protocol Failure</h3>
                        <p className="text-sm font-serif-body text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed mb-10">
                          Cloud extraction for this entity type is restricted. Local execution required.
                        </p>
                        <motion.a 
                          whileTap={{ scale: 0.95 }}
                          href={fileLink || '#'} 
                          className="flex items-center gap-3 px-8 py-4 bg-ink text-paper font-mono text-[11px] tracking-[0.18em] uppercase"
                        >
                          <Download className="w-5 h-5" />
                          Acquire Payload
                        </motion.a>
                    </div>
                 )}
               </div>
             )}
          </div>
        </div>
      </motion.div>
      <style dangerouslySetInnerHTML={{ __html: `
        .db-embed-container iframe { width: 100% !important; height: 100% !important; border: none !important; }
      `}} />
    </div>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex gap-4 items-start group">
      <div className="w-10 h-10 bg-[var(--bg-surface)] border border-rule flex items-center justify-center shrink-0 text-[var(--text-muted)] group-hover:text-accent transition-colors">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" }) : icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)] mb-1">{label}</p>
        <p className="text-base font-serif-body text-[var(--text-primary)] tracking-tight whitespace-pre-wrap break-words">{value}</p>
      </div>
    </div>
  )
}
