import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

  const themeColors = {
    indigo: {
      ring: "focus:ring-cyber-violet/5 focus:border-cyber-violet",
      hover: "hover:bg-cyber-violet/[0.03]",
      activeBadge: "bg-cyber-violet text-white",
      optionText: "text-[var(--text-primary)] hover:text-cyber-violet"
    },
    amber: {
      ring: "focus:ring-amber-500/5 focus:border-amber-500",
      hover: "hover:bg-amber-500/[0.03]",
      activeBadge: "bg-amber-500 text-white",
      optionText: "text-[var(--text-primary)] hover:text-amber-600"
    }
  };

  const theme = themeColors[activeColor];

  return (
    <div className={cn("relative", isOpen ? "z-[100]" : "z-10")} ref={containerRef}>
      <div className="relative group">
        <input 
          type="text" required placeholder={placeholder}
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); }}
          onFocus={() => { setInputValue(''); setIsOpen(true); }}
          onBlur={() => setTimeout(() => {
             setInputValue(value);
             setIsOpen(false);
          }, 200)}
          className={cn(
            "w-full px-5 py-3.5 bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[22px] outline-none transition-all placeholder:text-[var(--text-muted)] font-bold text-sm text-[var(--text-primary)] focus:bg-[var(--bg-surface)] focus:ring-4",
            theme.ring
          )}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-400 group-focus-within:rotate-180 transition-all pointer-events-none">
           <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
            className="absolute top-full left-0 w-full mt-3 bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--glass-border)] rounded-[28px] shadow-glass max-h-[min(280px,45vh)] overflow-y-auto p-2 z-[100] custom-scrollbar"
          >
            {filtered.length > 0 ? (
              <div className="space-y-0.5">
                {filtered.map(opt => (
                  <div 
                    key={opt}
                    className={cn(
                      "px-4 py-3 cursor-pointer rounded-2xl text-sm font-black tracking-tight transition-all",
                      theme.hover, theme.optionText
                    )}
                    onMouseDown={(e) => { 
                      e.preventDefault();
                      onChange(opt); 
                      setInputValue(opt);
                      setIsOpen(false); 
                    }}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-4 flex flex-col items-center gap-2 text-center">
                <Sparkles className="w-5 h-5 text-[var(--text-muted)]" />
                <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">New Entry Expected</p>
                <p className="text-[11px] text-[var(--text-muted)] font-bold italic">Master data suggested only.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
    <div className={cn("relative", isOpen ? "z-[100]" : "z-10")} ref={containerRef}>
       <div 
         className={cn(
           "w-full min-h-[56px] bg-[var(--input-bg)] border border-[var(--border-primary)] rounded-[24px] focus-within:ring-4 focus-within:ring-cyber-violet/5 focus-within:border-cyber-violet focus-within:bg-[var(--bg-surface)] transition-all p-2 flex flex-wrap gap-2 items-center cursor-text relative pr-12"
         )}
         onClick={() => setIsOpen(true)}
       >
         <AnimatePresence>
           {values.map(v => (
             <motion.div 
               layout
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.8 }}
               key={v} title={v} 
               className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-primary)] shadow-sm text-[var(--text-primary)] text-[10px] font-black uppercase tracking-tight pl-3 pr-2 py-1.5 rounded-[14px] max-w-full group"
             >
               <span className="truncate max-w-[150px]">{v}</span>
               <button 
                 type="button"
                 className="p-1 rounded-full hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                 onClick={(e: React.MouseEvent) => { e.stopPropagation(); removeValue(v); }}
               >
                 <X className="w-3 h-3" />
               </button>
             </motion.div>
           ))}
         </AnimatePresence>
         
         <input 
           type="text" placeholder={values.length === 0 ? placeholder : ''}
           value={inputValue}
           onChange={(e) => { setInputValue(e.target.value); setIsOpen(true); }}
           onFocus={() => setIsOpen(true)}
           onBlur={() => setTimeout(() => {
              setInputValue('');
              setIsOpen(false);
           }, 200)}
           className="flex-1 min-w-[100px] bg-transparent outline-none px-2 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
         />
         <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:rotate-180 transition-all">
           <ChevronDown className="w-5 h-5" />
         </div>
       </div>

       <AnimatePresence>
         {isOpen && (
           <motion.div 
             initial={{ opacity: 0, y: 10, scale: 0.98 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 5, scale: 0.98 }}
             className="absolute top-full left-0 w-full mt-3 bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--glass-border)] rounded-[28px] shadow-glass max-h-[280px] overflow-y-auto p-2 z-[100] custom-scrollbar"
           >
             {filtered.length > 0 ? (
               <div className="space-y-0.5">
                 {filtered.map(opt => (
                   <div 
                     key={opt}
                     className="px-4 py-3 cursor-pointer rounded-2xl text-sm font-black tracking-tight text-[var(--text-primary)] hover:bg-cyber-violet/[0.03] hover:text-cyber-violet transition-all"
                     onMouseDown={(e) => { 
                       e.preventDefault();
                       onChange([...values, opt]); 
                       setInputValue('');
                       setIsOpen(false); 
                     }}
                   >
                     {opt}
                   </div>
                 ))}
               </div>
             ) : (
               <div className="px-6 py-4 flex items-center justify-center gap-3 text-[var(--text-muted)] italic text-xs font-medium">
                 No fresh labels found.
               </div>
             )}
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}
