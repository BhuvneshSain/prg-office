import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface ComboBoxProps {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  activeColor?: 'indigo' | 'amber';
}

export function ComboBox({ value, onChange, options, placeholder, activeColor = 'indigo' }: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { setInputValue(value); }, [value]);
  
  const filtered = options.filter(o => o.toLowerCase().includes(inputValue.toLowerCase()));

  const ringColor = activeColor === 'amber' ? 'focus:ring-amber-500/20 focus:border-amber-500' : 'focus:ring-indigo-500/20 focus:border-indigo-500';
  const hoverColor = activeColor === 'amber' ? 'hover:bg-amber-50' : 'hover:bg-indigo-50';

  return (
    <div className={`relative ${isOpen ? 'z-[100]' : 'z-10'}`} ref={containerRef}>
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
          className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all placeholder:text-slate-400 ${ringColor}`}
        />
        <div className="absolute right-3 text-slate-400 pointer-events-none">
           <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-[min(224px,45vh)] overflow-y-auto py-1 z-[100] custom-scrollbar animate-in fade-in slide-in-from-top-2">
          {filtered.length > 0 ? filtered.map(opt => (
            <div 
              key={opt}
              className={`px-4 py-2.5 cursor-pointer text-slate-700 text-sm font-medium transition-colors ${hoverColor}`}
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
  );
}

interface MultiComboBoxProps {
  values: string[];
  onChange: (v: string[]) => void;
  options: string[];
  placeholder: string;
}

export function MultiComboBox({ values, onChange, options, placeholder }: MultiComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  const filtered = options.filter(o => o.toLowerCase().includes(inputValue.toLowerCase()) && !values.includes(o));
  const removeValue = (val: string) => onChange(values.filter(v => v !== val));
  
  return (
    <div className={`relative ${isOpen ? 'z-[100]' : 'z-10'}`} ref={containerRef}>
       <div 
         className="w-full min-h-[50px] bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all p-2 flex flex-wrap gap-2 items-center cursor-text relative pr-10"
         onClick={() => setIsOpen(true)}
       >
         {values.map(v => (
           <div key={v} title={v} className="flex items-center gap-1.5 bg-white border border-slate-200 shadow-sm text-slate-700 text-[11px] font-bold px-2.5 py-1.5 rounded-lg max-w-full">
             <span className="truncate max-w-[150px] sm:max-w-[200px]">{v}</span>
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
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] max-h-[min(224px,45vh)] overflow-y-auto py-1 z-[100] custom-scrollbar animate-in fade-in slide-in-from-top-2">
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
  );
}
