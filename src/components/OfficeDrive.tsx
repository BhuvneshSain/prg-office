import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Folder, FolderPlus, Upload, Trash2, Edit, Search, Grid, List, 
  ChevronRight, FileText, Image, Video, Music, File, X, 
  ExternalLink, Loader2, HardDrive, Clipboard, Scissors, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dbx, checkConfig, ensureValidToken } from '../lib/serviceUtils';

interface DropboxEntry {
  '.tag': 'file' | 'folder';
  name: string;
  path_lower?: string;
  path_display?: string;
  id: string;
  client_modified?: string;
  server_modified?: string;
  rev?: string;
  size?: number;
}

const INPUT_CLS = "w-full px-4 py-3 bg-panel border border-rule text-ink placeholder:text-muted/50 font-serif-body text-sm focus:outline-none focus:border-ink transition-colors";
const LABEL_CLS = "block font-mono text-[11px] text-muted tracking-[0.18em] uppercase";

const formatBytes = (bytes?: number, decimals = 2) => {
  if (bytes === undefined || bytes === null) return '-';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getFileIcon = (name: string, tag: string) => {
  if (tag === 'folder') return <Folder className="w-8 h-8 text-accent shrink-0" />;
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return <FileText className="w-8 h-8 text-bad shrink-0" />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
      return <Image className="w-8 h-8 text-good shrink-0" />;
    case 'mp4':
    case 'mov':
    case 'avi':
    case 'mkv':
      return <Video className="w-8 h-8 text-accent shrink-0" />;
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'm4a':
      return <Music className="w-8 h-8 text-accent shrink-0" />;
    case 'zip':
    case 'tar':
    case 'gz':
    case 'rar':
    case '7z':
      return <File className="w-8 h-8 text-muted shrink-0" />;
    case 'js':
    case 'ts':
    case 'tsx':
    case 'jsx':
    case 'html':
    case 'css':
    case 'json':
      return <FileText className="w-8 h-8 text-accent shrink-0" />;
    default:
      return <File className="w-8 h-8 text-muted shrink-0" />;
  }
};

export default function OfficeDrive({ onRefresh }: { onRefresh: () => void }) {
  const [currentPath, setCurrentPath] = useState('/office-drive');
  const [entries, setEntries] = useState<DropboxEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<DropboxEntry | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Modals & inputs
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DropboxEntry | null>(null);
  const [renameNewName, setRenameNewName] = useState('');
  
  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop states
  const [dragActive, setDragActive] = useState(false);
  const dragCounterRef = useRef(0);

  // Clipboard state (for cut/copy/paste)
  const [clipboard, setClipboard] = useState<{ type: 'cut' | 'copy'; item: DropboxEntry } | null>(null);

  // Initial load
  useEffect(() => {
    if (checkConfig()) {
      loadDirectory(currentPath);
    }
  }, [currentPath]);

  // Fetch preview link when selection changes
  useEffect(() => {
    if (!selectedItem || selectedItem['.tag'] !== 'file') {
      setPreviewUrl(null);
      return;
    }
    
    const ext = selectedItem.name.split('.').pop()?.toLowerCase() || '';
    const isPreviewable = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'mp4', 'mov', 'avi', 'mkv', 'pdf'].includes(ext);
    
    if (!isPreviewable) {
      setPreviewUrl(null);
      return;
    }

    let isMounted = true;
    const fetchPreview = async () => {
      setLoadingPreview(true);
      setPreviewUrl(null);
      try {
        await ensureValidToken();
        const response = await dbx.filesGetTemporaryLink({ path: selectedItem.path_display || '' });
        if (isMounted) {
          setPreviewUrl(response.result.link);
        }
      } catch (err) {
        console.error("Error fetching preview link:", err);
      } finally {
        if (isMounted) {
          setLoadingPreview(false);
        }
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [selectedItem]);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    setSelectedItem(null);
    try {
      await ensureValidToken();
      const response = await dbx.filesListFolder({ path });
      setEntries(response.result.entries as DropboxEntry[]);
    } catch (err: unknown) {
      const summary = (err as { error?: { error_summary?: string } })?.error?.error_summary || "";
      // Auto-create drive root folder if missing
      if (path === '/office-drive' && (err?.status === 409 || summary.includes('not_found'))) {
        try {
          await ensureValidToken();
          await dbx.filesCreateFolderV2({ path: '/office-drive' });
          await ensureValidToken();
          const retry = await dbx.filesListFolder({ path: '/office-drive' });
          setEntries(retry.result.entries as DropboxEntry[]);
        } catch (createErr) {
          console.error("Auto-creating /office-drive root failed:", createErr);
          setEntries([]);
        }
      } else {
        console.error("List folder failed:", err);
        setEntries([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCut = (item: DropboxEntry) => {
    setClipboard({ type: 'cut', item });
  };

  const handleCopy = (item: DropboxEntry) => {
    setClipboard({ type: 'copy', item });
  };

  const handlePaste = async () => {
    if (!clipboard || !clipboard.item.path_display) return;
    const item = clipboard.item;
    const oldPath = item.path_display!;
    const newPath = `${currentPath}/${item.name}`;

    if (oldPath === newPath) {
      alert("Cannot paste an item into the same folder with the same name.");
      return;
    }

    setLoading(true);
    try {
      await ensureValidToken();
      if (clipboard.type === 'cut') {
        await dbx.filesMoveV2({ from_path: oldPath, to_path: newPath });
        setClipboard(null); // Clear clipboard after paste on move
      } else {
        await dbx.filesCopyV2({ from_path: oldPath, to_path: newPath });
      }
      loadDirectory(currentPath);
      onRefresh();
    } catch (err) {
      console.error("Paste operation failed:", err);
      alert("Failed to paste item. An item with the same name may already exist in the destination.");
    } finally {
      setLoading(false);
    }
  };

  // Breadcrumbs parsing
  const breadcrumbs = useMemo(() => {
    const relative = currentPath.substring('/office-drive'.length);
    const parts = relative.split('/').filter(Boolean);
    return ['Drive', ...parts];
  }, [currentPath]);

  const navigateToBreadcrumb = (index: number) => {
    if (index === 0) {
      setCurrentPath('/office-drive');
    } else {
      const relativeParts = currentPath.substring('/office-drive'.length).split('/').filter(Boolean);
      const targetParts = relativeParts.slice(0, index);
      setCurrentPath('/office-drive/' + targetParts.join('/'));
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const cleanName = newFolderName.trim().replace(new RegExp('[/\\\\?%*:|"<>]', 'g'), '_');
    const folderPath = `${currentPath}/${cleanName}`;
    try {
      await ensureValidToken();
      await dbx.filesCreateFolderV2({ path: folderPath });
      setNewFolderName('');
      setShowNewFolderModal(false);
      loadDirectory(currentPath);
      onRefresh();
    } catch (err) {
      console.error("Create folder failed:", err);
      alert("Failed to create folder. Make sure the name is unique and valid.");
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameNewName.trim()) return;
    const cleanName = renameNewName.trim().replace(new RegExp('[/\\\\?%*:|"<>]', 'g'), '_');
    const parentPath = renameTarget.path_display?.substring(0, renameTarget.path_display.lastIndexOf('/'));
    const newPath = `${parentPath}/${cleanName}`;
    try {
      await ensureValidToken();
      await dbx.filesMoveV2({ 
        from_path: renameTarget.path_display || '', 
        to_path: newPath 
      });
      setRenameNewName('');
      setRenameTarget(null);
      setShowRenameModal(false);
      loadDirectory(currentPath);
      onRefresh();
    } catch (err) {
      console.error("Rename failed:", err);
      alert("Failed to rename item. Ensure the new name does not clash.");
    }
  };

  const handleDelete = async (item: DropboxEntry) => {
    if (!item.path_display) return;
    const confirmMsg = `Are you sure you want to delete "${item.name}"? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await ensureValidToken();
      await dbx.filesDeleteV2({ path: item.path_display });
      if (selectedItem?.id === item.id) setSelectedItem(null);
      loadDirectory(currentPath);
      onRefresh();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete the item.");
    }
  };

  const handleOpen = async (item: DropboxEntry) => {
    if (item['.tag'] === 'folder') {
      setCurrentPath(item.path_display || '');
    } else {
      try {
        await ensureValidToken();
        const linkResponse = await dbx.filesGetTemporaryLink({ path: item.path_display || '' });
        window.open(linkResponse.result.link, '_blank');
      } catch (err) {
        console.error("Get file link failed:", err);
        alert("Could not open this file.");
      }
    }
  };

  const uploadWithRetry = async (path: string, contents: File, retries = 3, delay = 1500): Promise<unknown> => {
    try {
      await ensureValidToken();
      return await dbx.filesUpload({
        path,
        contents,
        mode: { '.tag': 'overwrite' }
      });
    } catch (err: unknown) {
      const summary = (err as { error?: { error_summary?: string }; status?: number })?.error?.error_summary || "";
      const status = err?.status;
      
      // Retry on lock contention or rate limits
      if ((status === 429 || status === 409 || summary.includes('too_many_write_operations') || summary.includes('write_conflict')) && retries > 0) {
        console.warn(`[Dropbox] Rate limit or write lock hit for ${path}. Retrying in ${delay}ms... (Retries left: ${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return uploadWithRetry(path, contents, retries - 1, delay * 1.5);
      }
      throw err;
    }
  };

  const uploadFileList = async (files: FileList) => {
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uploadPath = `${currentPath}/${safeName}`;
        
        await uploadWithRetry(uploadPath, file);
        setUploadProgress(prev => ({ ...prev, current: i + 1 }));
        
        // Wait briefly between sequential uploads to avoid Dropbox folder locks
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      loadDirectory(currentPath);
      onRefresh();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Dropbox may be busy or rate-limited. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFileList(files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter") {
      dragCounterRef.current++;
      setDragActive(true);
    } else if (e.type === "dragleave" || e.type === "dragend") {
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setDragActive(false);
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFileList(e.dataTransfer.files);
    }
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      // Folders first
      if (a['.tag'] === 'folder' && b['.tag'] === 'file') return -1;
      if (a['.tag'] === 'file' && b['.tag'] === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });

    if (!search.trim()) return sorted;
    return sorted.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  }, [entries, search]);

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0 relative">
      {/* Search and Action Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Search drive files..."
            className="w-full pl-10 pr-4 py-2 border border-rule bg-panel focus:outline-none focus:border-ink transition-colors font-serif-body text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* View Mode Toggle */}
          <div className="border border-rule flex items-center p-0.5 shrink-0 bg-panel">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* New Folder Action */}
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="flex items-center gap-2 border border-rule px-4 py-2 hover:border-ink transition-all font-mono text-[10px] tracking-[0.12em] uppercase text-muted hover:text-ink bg-panel text-left cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-accent" />
            New Folder
          </button>

          {/* Paste Action */}
          {clipboard && (
            <button
              onClick={handlePaste}
              disabled={loading || uploading}
              className="flex items-center gap-2 border border-accent/40 px-4 py-2 hover:border-accent transition-all font-mono text-[10px] tracking-[0.12em] uppercase text-accent hover:bg-accent/5 bg-panel cursor-pointer"
            >
              <Clipboard className="w-4 h-4 text-accent" />
              Paste ({clipboard.type === 'cut' ? 'Move' : 'Copy'})
            </button>
          )}

          {/* Upload Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-ink text-paper font-mono text-[10px] tracking-[0.16em] uppercase hover:bg-ink/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading {uploadProgress.current}/{uploadProgress.total}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload File
              </>
            )}
          </button>
          <input
            type="file"
            multiple
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* Directory Path Breadcrumbs */}
      <div className="flex items-center flex-wrap gap-1 font-mono text-[11px] text-muted tracking-wide pb-2 border-b border-rule">
        <HardDrive className="w-3.5 h-3.5 mr-1 text-ink opacity-70" />
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <ChevronRight className="w-3 h-3 text-muted mx-0.5 shrink-0" />}
            <button
              onClick={() => navigateToBreadcrumb(idx)}
              className={`hover:text-accent hover:underline transition-colors cursor-pointer ${
                idx === breadcrumbs.length - 1 ? 'text-ink font-semibold' : ''
              }`}
            >
              {crumb}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Clipboard Status Banner */}
      {clipboard && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-accent/5 border border-accent/20 rounded-sm font-mono text-[10px] text-accent tracking-wider uppercase">
          <div className="flex items-center gap-2">
            <Clipboard className="w-4 h-4 text-accent animate-pulse" />
            <span>Active Clipboard: {clipboard.type === 'cut' ? 'Moving' : 'Copying'} "{clipboard.item.name}"</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePaste}
              disabled={loading || uploading}
              className="hover:underline font-bold text-accent cursor-pointer"
            >
              Paste Here
            </button>
            <span className="opacity-40">|</span>
            <button 
              onClick={() => setClipboard(null)} 
              className="hover:text-bad transition-colors cursor-pointer"
              title="Clear Clipboard"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Files Area with Drag and Drop handlers */}
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className="flex-1 flex flex-col md:flex-row gap-6 items-stretch min-h-0 relative"
      >
        {/* Drag Overlay overlay cover */}
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-paper/95 border-2 border-dashed border-accent flex flex-col items-center justify-center gap-4 p-8 pointer-events-none"
            >
              <Upload className="w-12 h-12 text-accent animate-bounce" />
              <div className="text-center">
                <h3 className="font-serif-display italic text-lg text-ink">Drop your files here</h3>
                <p className="font-mono text-[10px] text-muted tracking-[0.14em] uppercase mt-1">
                  Upload to {breadcrumbs[breadcrumbs.length - 1]}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
              <p className="font-mono text-[10px] text-muted tracking-[0.12em] uppercase">Syncing files with Dropbox...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-rule rounded-sm bg-panel p-8">
              <Folder className="w-12 h-12 text-muted/40 mb-3" />
              <h3 className="font-serif-display italic text-lg text-muted">This directory is empty</h3>
              <p className="font-serif-body text-xs text-muted/80 max-w-[280px] mt-1.5">
                {search ? "No items match your search filter." : "Get started by uploading files or creating subfolders above."}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {viewMode === 'grid' ? (
                /* GRID VIEW */
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                >
                  {filteredEntries.map(entry => {
                    const isSelected = selectedItem?.id === entry.id;
                    const isCut = clipboard?.item.id === entry.id && clipboard?.type === 'cut';
                    return (
                      <motion.div
                        layout
                        key={entry.id}
                        onClick={() => setSelectedItem(entry)}
                        onDoubleClick={() => handleOpen(entry)}
                        className={`border p-4 cursor-pointer flex flex-col items-center text-center justify-between h-36 select-none relative group transition-all ${
                          isSelected ? 'border-accent bg-accent/5' : 'border-rule bg-panel hover:border-ink'
                        } ${isCut ? 'opacity-40' : ''}`}
                      >
                        <div className="flex-1 flex items-center justify-center">
                          {getFileIcon(entry.name, entry['.tag'])}
                        </div>
                        <div className="w-full mt-2">
                          <p className="font-serif-body text-xs truncate max-w-full text-ink font-medium leading-tight px-1" title={entry.name}>
                            {entry.name}
                          </p>
                          <p className="font-mono text-[9px] text-muted tracking-tight mt-0.5">
                            {entry['.tag'] === 'folder' ? 'Folder' : formatBytes(entry.size)}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                /* LIST VIEW */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-rule bg-panel divide-y divide-rule"
                >
                  {filteredEntries.map(entry => {
                    const isSelected = selectedItem?.id === entry.id;
                    const isCut = clipboard?.item.id === entry.id && clipboard?.type === 'cut';
                    return (
                      <div
                        key={entry.id}
                        onClick={() => setSelectedItem(entry)}
                        onDoubleClick={() => handleOpen(entry)}
                        className={`flex items-center justify-between p-3.5 cursor-pointer select-none transition-colors ${
                          isSelected ? 'bg-accent/5 text-accent' : 'hover:bg-paper'
                        } ${isCut ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="shrink-0 scale-75">
                            {getFileIcon(entry.name, entry['.tag'])}
                          </div>
                          <span className="font-serif-body text-sm text-ink font-medium truncate pr-4">
                            {entry.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-right font-mono text-[10px] text-muted shrink-0">
                          <span className="hidden sm:inline w-20">
                            {entry['.tag'] === 'folder' ? 'Folder' : formatBytes(entry.size)}
                          </span>
                          <span className="hidden md:inline w-36">
                            {entry['.tag'] === 'file' ? formatDate(entry.server_modified) : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Selected Item Sidebar Panel */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full md:w-80 border-t md:border-t-0 md:border-l border-rule md:pl-6 pt-6 md:pt-0 shrink-0 flex flex-col gap-6"
            >
              <div className="border border-ink bg-panel p-5 relative space-y-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute right-3 top-3 p-1 text-muted hover:text-ink transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="border-b border-rule pb-4 flex justify-center w-full overflow-hidden">
                  {selectedItem['.tag'] === 'folder' ? (
                    <div className="py-4 scale-125">
                      {getFileIcon(selectedItem.name, selectedItem['.tag'])}
                    </div>
                  ) : (() => {
                    const ext = selectedItem.name.split('.').pop()?.toLowerCase() || '';
                    if (loadingPreview) {
                      return (
                        <div className="w-full aspect-video flex flex-col items-center justify-center bg-paper border border-rule gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-accent" />
                          <span className="font-mono text-[9px] text-muted uppercase tracking-wider">Generating Preview...</span>
                        </div>
                      );
                    }
                    if (previewUrl) {
                      if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
                        return (
                          <div 
                            onClick={() => setShowPreviewModal(true)}
                            className="relative group w-full aspect-video border border-rule bg-paper flex items-center justify-center cursor-pointer overflow-hidden"
                          >
                            <img src={previewUrl} alt={selectedItem.name} className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-paper font-mono text-[9px] uppercase tracking-wider">
                              Click to Zoom
                            </div>
                          </div>
                        );
                      }
                      if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
                        return (
                          <div 
                            onClick={() => setShowPreviewModal(true)}
                            className="relative group w-full aspect-video border border-rule bg-paper flex items-center justify-center cursor-pointer overflow-hidden"
                          >
                            <video src={previewUrl} muted playsInline className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-ink/30 flex items-center justify-center group-hover:bg-ink/50 transition-colors">
                              <div className="p-2.5 rounded-full bg-paper text-ink border border-ink shadow-sm scale-90 group-hover:scale-100 transition-transform">
                                <Video className="w-4 h-4 text-accent fill-accent/10" />
                              </div>
                            </div>
                          </div>
                        );
                      }
                      if (ext === 'pdf') {
                        return (
                          <div 
                            onClick={() => setShowPreviewModal(true)}
                            className="relative group w-full aspect-video border border-rule bg-paper flex flex-col items-center justify-center gap-2 cursor-pointer"
                          >
                            <FileText className="w-8 h-8 text-bad shrink-0" />
                            <span className="font-mono text-[9px] text-muted uppercase tracking-wider">Click to Read PDF</span>
                            <div className="absolute inset-0 bg-ink/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        );
                      }
                    }
                    return (
                      <div className="py-4 scale-125">
                        {getFileIcon(selectedItem.name, selectedItem['.tag'])}
                      </div>
                    );
                  })()}
                </div>

                <div className="space-y-3 min-w-0">
                  <h4 className="font-serif-display italic text-lg leading-tight break-words pr-4" title={selectedItem.name}>
                    {selectedItem.name}
                  </h4>
                  <div className="grid grid-cols-3 gap-y-2 font-mono text-[10px] text-muted uppercase tracking-wider">
                    <span className="col-span-1">Type</span>
                    <span className="col-span-2 text-ink normal-case font-serif-body text-xs font-medium">
                      {selectedItem['.tag'] === 'folder' ? 'Folder' : 'File'}
                    </span>

                    {selectedItem['.tag'] === 'file' && (
                      <>
                        <span className="col-span-1">Size</span>
                        <span className="col-span-2 text-ink font-semibold">{formatBytes(selectedItem.size)}</span>

                        <span className="col-span-1">Modified</span>
                        <span className="col-span-2 text-ink normal-case font-serif-body text-xs">
                          {formatDate(selectedItem.server_modified)}
                        </span>
                      </>
                    )}

                    <span className="col-span-1">Path</span>
                    <span className="col-span-2 text-ink lowercase truncate" title={selectedItem.path_display}>
                      {selectedItem.path_display}
                    </span>
                  </div>
                </div>

                <div className="border-t border-rule pt-4 grid grid-cols-2 gap-2">
                  {selectedItem['.tag'] === 'file' && ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'mp4', 'mov', 'avi', 'mkv', 'pdf'].includes(selectedItem.name.split('.').pop()?.toLowerCase() || '') && (
                    <button
                      onClick={() => setShowPreviewModal(true)}
                      className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 bg-accent text-paper font-mono text-[9px] tracking-widest uppercase hover:bg-accent/90 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Preview / Play
                    </button>
                  )}
                  <button
                    onClick={() => handleOpen(selectedItem)}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-ink text-paper font-mono text-[9px] tracking-widest uppercase hover:bg-ink/90 transition-colors cursor-pointer"
                  >
                    {selectedItem['.tag'] === 'folder' ? (
                      <>Open</>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        Download
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setRenameTarget(selectedItem);
                      setRenameNewName(selectedItem.name);
                      setShowRenameModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 border border-rule hover:border-ink font-mono text-[9px] tracking-widest uppercase text-muted hover:text-ink transition-colors bg-paper cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Rename
                  </button>

                  <button
                    onClick={() => handleCut(selectedItem)}
                    className="flex items-center justify-center gap-1.5 py-2.5 border border-rule hover:border-ink font-mono text-[9px] tracking-widest uppercase text-muted hover:text-ink transition-colors bg-paper cursor-pointer"
                  >
                    <Scissors className="w-3.5 h-3.5 text-accent" />
                    Cut
                  </button>

                  <button
                    onClick={() => handleCopy(selectedItem)}
                    className="flex items-center justify-center gap-1.5 py-2.5 border border-rule hover:border-ink font-mono text-[9px] tracking-widest uppercase text-muted hover:text-ink transition-colors bg-paper cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-accent" />
                    Copy
                  </button>

                  <button
                    onClick={() => handleDelete(selectedItem)}
                    className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 border border-bad/30 hover:border-bad bg-bad/5 text-bad font-mono text-[9px] tracking-widest uppercase transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Item
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* NEW FOLDER MODAL */}
      <AnimatePresence>
        {showNewFolderModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/20"
              onClick={() => setShowNewFolderModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="relative bg-paper w-full max-w-sm border border-rule overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-rule flex justify-between items-center bg-panel">
                <div className="flex items-center gap-2">
                  <FolderPlus className="w-4 h-4 text-accent" />
                  <h3 className="font-serif-display italic text-base">New Folder</h3>
                </div>
                <button onClick={() => setShowNewFolderModal(false)} className="p-1.5 text-muted hover:text-bad transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateFolder} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className={LABEL_CLS}>Folder Name</label>
                  <input
                    required
                    autoFocus
                    placeholder="Enter folder name..."
                    className={INPUT_CLS}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-ink text-paper font-mono text-[10px] tracking-[0.18em] uppercase flex items-center justify-center gap-2 hover:bg-ink/90 transition-colors cursor-pointer"
                >
                  Create Folder
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RENAME MODAL */}
      <AnimatePresence>
        {showRenameModal && renameTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/20"
              onClick={() => setShowRenameModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="relative bg-paper w-full max-w-sm border border-rule overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-rule flex justify-between items-center bg-panel">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-accent" />
                  <h3 className="font-serif-display italic text-base">Rename Item</h3>
                </div>
                <button onClick={() => setShowRenameModal(false)} className="p-1.5 text-muted hover:text-bad transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRename} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className={LABEL_CLS}>New Name</label>
                  <input
                    required
                    autoFocus
                    placeholder="Enter new name..."
                    className={INPUT_CLS}
                    value={renameNewName}
                    onChange={(e) => setRenameNewName(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-ink text-paper font-mono text-[10px] tracking-[0.18em] uppercase flex items-center justify-center gap-2 hover:bg-ink/90 transition-colors cursor-pointer"
                >
                  Save Rename
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREVIEW / PLAY MODAL */}
      <AnimatePresence>
        {showPreviewModal && selectedItem && previewUrl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/75 backdrop-blur-sm"
              onClick={() => setShowPreviewModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-paper w-full max-w-4xl border border-ink overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-rule flex justify-between items-center bg-panel shrink-0">
                <div className="flex items-center gap-2 min-w-0 pr-4">
                  <HardDrive className="w-4 h-4 text-accent shrink-0" />
                  <h3 className="font-serif-display italic text-base truncate" title={selectedItem.name}>
                    {selectedItem.name}
                  </h3>
                  <span className="font-mono text-[9px] text-muted px-1.5 py-0.5 bg-ink/5 border border-rule">
                    {formatBytes(selectedItem.size)}
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <a
                    href={previewUrl}
                    download={selectedItem.name}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-muted hover:text-accent transition-colors flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider"
                    title="Download File"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download</span>
                  </a>
                  <button 
                    onClick={() => setShowPreviewModal(false)} 
                    className="p-1.5 text-muted hover:text-bad transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-auto p-6 bg-paper flex items-center justify-center min-h-[300px]">
                {(() => {
                  const ext = selectedItem.name.split('.').pop()?.toLowerCase() || '';
                  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
                    return (
                      <img 
                        src={previewUrl} 
                        alt={selectedItem.name} 
                        className="max-h-[70vh] max-w-full object-contain select-none shadow-sm" 
                      />
                    );
                  }
                  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
                    return (
                      <video 
                        src={previewUrl} 
                        controls 
                        autoPlay 
                        className="max-h-[70vh] w-full max-w-3xl outline-none shadow-sm" 
                      />
                    );
                  }
                  if (ext === 'pdf') {
                    return (
                      <iframe 
                        src={`${previewUrl}#toolbar=0`}
                        title={selectedItem.name} 
                        className="w-full h-[70vh] border-0 bg-panel shadow-inner" 
                      />
                    );
                  }
                  return (
                    <div className="flex flex-col items-center gap-3 py-12">
                      {getFileIcon(selectedItem.name, selectedItem['.tag'])}
                      <p className="font-serif-body text-sm text-ink font-medium">No preview available for this format.</p>
                      <a 
                        href={previewUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="font-mono text-[10px] text-accent hover:underline uppercase tracking-wider"
                      >
                        Download File instead
                      </a>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
