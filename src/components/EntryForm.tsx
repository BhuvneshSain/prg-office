import { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, XCircle, Loader2, File as FileIcon, ChevronDown, X } from 'lucide-react';
import type { RegisterEntry } from '../types';
import { addRegisterEntry, uploadAttachment } from '../lib/dropbox';

interface EntryFormProps {
  type: 'inward' | 'outward';
  existingDepts: string[];
  existingProjects: string[];
  onSuccess: () => void;
}

export default function EntryForm({ type, existingDepts, existingProjects, onSuccess }: EntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [fileError, setFileError] = useState('');
  
  const [dispatchTo, setDispatchTo] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    partyName: '',
    subject: '',
    referenceNumber: '',
    remarks: '',
    project: ''
  });
  
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileError) return;
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      let attachmentData = null;
      if (file) {
        attachmentData = await uploadAttachment(file);
        if (!attachmentData) {
          throw new Error('Failed to upload file to Dropbox.');
        }
      }
      
      const finalRefNumber = type === 'outward' && dispatchTo.trim() 
        ? `${formData.referenceNumber}-${dispatchTo}`
        : formData.referenceNumber;

      const newEntry: RegisterEntry = {
        id: Date.now().toString(),
        type,
        date: formData.date,
        partyName: formData.partyName,
        subject: formData.subject,
        referenceNumber: finalRefNumber,
        remarks: formData.remarks,
        project: formData.project,
        attachments: attachmentData ? [attachmentData] : []
      };
      
      const success = await addRegisterEntry(newEntry);
      
      if (success) {
        setSuccessMsg(`Successfully saved ${type} record.`);
        setFormData({ ...formData, subject: '', remarks: '', referenceNumber: '', partyName: '', project: '' });
        setDispatchTo('');
        setFile(null);
        onSuccess();
      } else {
        throw new Error('Failed to save JSON data to Dropbox.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 w-full max-w-3xl mx-auto">
      <div className="mb-6 pb-4 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 capitalize">New {type} Entry</h2>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${type === 'inward' ? 'bg-blue-100/50 text-blue-700' : 'bg-emerald-100/50 text-emerald-700'}`}>
          {type}
        </span>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
          <p className="text-emerald-700 font-medium text-sm">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl relative bg-red-50/80 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <p className="text-red-700 font-medium text-sm">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Date</label>
            <input 
              type="date" required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">{type === 'outward' ? 'From Dispatch No.' : 'Dispatch No.'}</label>
            <div className="flex items-center gap-2 w-full">
              <input 
                type="number" required placeholder="e.g., 1024"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({...formData, referenceNumber: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              />
              {type === 'outward' && (
                <>
                  <span className="text-slate-400 font-bold">-</span>
                  <input 
                    type="number" placeholder="To (Opt)"
                    value={dispatchTo}
                    onChange={(e) => setDispatchTo(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-50">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">{type === 'inward' ? 'Sender Dept' : 'Recipient Dept(s)'}</label>
            {type === 'outward' ? (
              <MultiComboBox 
                values={formData.partyName.split('|||').filter(Boolean)}
                onChange={(vals) => setFormData({...formData, partyName: vals.join('|||')})}
                options={existingDepts}
                placeholder="Select departments..."
              />
            ) : (
              <ComboBox 
                value={formData.partyName}
                onChange={(val) => setFormData({...formData, partyName: val})}
                options={existingDepts}
                placeholder="Select department..."
              />
            )}
          </div>
          <div className="space-y-2 relative z-50">
            <label className="text-sm font-semibold text-slate-700">Project</label>
            <ComboBox 
              value={formData.project || ''}
              onChange={(val) => setFormData({...formData, project: val})}
              options={existingProjects}
              placeholder="Select project..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-40">
           <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">RajKaj Ref. No. (Optional)</label>
            <input 
              type="number" placeholder="e.g., 50123"
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="space-y-2 relative z-40">
            <label className="text-sm font-semibold text-slate-700">Subject</label>
            <input 
              type="text" required placeholder="Subject or description..."
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="text-sm font-semibold text-slate-700">Attached Document (PDF Only)</label>
          <div className={`relative border-2 border-dashed ${fileError ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100/50 hover:border-indigo-300 hover:scale-[1.01] hover:shadow-sm active:scale-[0.99]'} rounded-2xl p-6 text-center transition-all duration-300 ease-out group`}>
            <input 
              type="file" 
              accept="application/pdf"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                setFileError('');
                if (e.target.files && e.target.files[0]) {
                  const selected = e.target.files[0];
                  if (selected.type !== 'application/pdf') {
                    setFileError('Only PDF files are allowed.');
                    setFile(null);
                    return;
                  }
                  setFile(selected);
                }
              }}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                   <FileIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB • Click to replace</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                 <div className="w-12 h-12 rounded-full bg-slate-200 group-hover:bg-indigo-100 flex items-center justify-center mb-2 transition-colors">
                   <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                </div>
                <p className={`text-sm font-semibold ${fileError ? 'text-red-600' : 'text-slate-700'}`}>{fileError || <>Drag & drop or <span className="text-indigo-600">click to browse</span></>}</p>
                <p className="text-xs text-slate-500">Supports PDF documents only</p>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full relative py-4 rounded-xl text-white font-semibold shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(79,70,229,0.3)] active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed ${type === 'inward' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving to Dropbox...
              </span>
            ) : (
              `Save ${type === 'inward' ? 'Inward' : 'Outward'} Entry`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


// Custom Non-Creatable Dropdown Component
function ComboBox({ value, onChange, options, placeholder }: { value: string, onChange: (v: string) => void, options: string[], placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  
  // Sync if externally changed (like form reset)
  useEffect(() => { setInputValue(value); }, [value]);
  
  const filtered = options.filter(o => o.toLowerCase().includes(inputValue.toLowerCase()));
  
  return (
    <div className="relative z-50">
      <div className="relative flex items-center">
        <input 
          type="text" required placeholder={placeholder}
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); }}
          onFocus={() => { setInputValue(''); setIsOpen(true); }}
          onBlur={() => setTimeout(() => {
             setInputValue(value);
             setIsOpen(false);
          }, 200)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
        />
        <div className="absolute right-3 text-slate-400 pointer-events-none">
           <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-56 overflow-y-auto py-1 z-50 custom-scrollbar animate-in fade-in slide-in-from-top-2">
          {filtered.length > 0 ? filtered.map(opt => (
            <div 
              key={opt}
              className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-slate-700 text-sm font-medium transition-colors"
              onMouseDown={(e) => { 
                e.preventDefault();
                onChange(opt); 
                setInputValue(opt);
                setIsOpen(false); 
              }}
            >
              {opt}
            </div>
          )) : (
            <div className="px-4 py-2.5 text-slate-400 text-sm font-medium italic">No matches. Master data only.</div>
          )}
        </div>
      )}
    </div>
  )
}

// Custom Non-Creatable Multi-Select Component
function MultiComboBox({ values, onChange, options, placeholder }: { values: string[], onChange: (v: string[]) => void, options: string[], placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const filtered = options.filter(o => o.toLowerCase().includes(inputValue.toLowerCase()) && !values.includes(o));

  const removeValue = (val: string) => onChange(values.filter(v => v !== val));
  
  return (
    <div className="relative z-50">
       <div 
         className="w-full min-h-[50px] bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all p-2 flex flex-wrap gap-2 items-center cursor-text relative pr-8"
         onClick={() => setIsOpen(true)}
       >
         {values.map(v => (
           <div key={v} title={v} className="flex items-center gap-1.5 bg-white border border-slate-200 shadow-sm text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-lg max-w-[220px]">
             <span className="truncate">{v}</span>
             <X className="w-3.5 h-3.5 flex-shrink-0 cursor-pointer text-slate-400 hover:text-red-500 transition-colors" onClick={(e: React.MouseEvent) => { e.stopPropagation(); removeValue(v); }} />
           </div>
         ))}
         <input 
           type="text" placeholder={values.length === 0 ? placeholder : ''}
           value={inputValue}
           onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); }}
           onFocus={() => setIsOpen(true)}
           onBlur={() => setTimeout(() => {
              setInputValue('');
              setIsOpen(false);
           }, 200)}
           className="flex-1 min-w-[120px] bg-transparent outline-none px-1 text-sm text-slate-800 placeholder:text-slate-400"
         />
         <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
           <ChevronDown className="w-5 h-5" />
         </div>
       </div>

       {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-56 overflow-y-auto py-1 z-50 custom-scrollbar animate-in fade-in slide-in-from-top-2">
          {filtered.length > 0 ? filtered.map(opt => (
            <div 
              key={opt}
              className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-slate-700 text-sm font-medium transition-colors"
              onMouseDown={(e) => { 
                e.preventDefault();
                onChange([...values, opt]); 
                setInputValue('');
                setIsOpen(false); 
              }}
            >
              {opt}
            </div>
          )) : (
            <div className="px-4 py-2.5 text-slate-400 text-sm font-medium italic">No available options. Master data only.</div>
          )}
        </div>
      )}
    </div>
  )
}
