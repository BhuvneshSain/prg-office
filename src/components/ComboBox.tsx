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
}

export function ComboBox({ value, onChange, options, placeholder }: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setInputValue(value); }, [value]);

  const filtered = options.filter(o => o.toLowerCase().includes(inputValue.toLowerCase()));

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
          className="w-full px-4 py-3 bg-panel border border-rule text-ink placeholder:text-muted/50 font-serif-body text-sm focus:outline-none focus:border-ink transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
           <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full left-0 w-full mt-1 bg-paper border border-rule max-h-[min(240px,40vh)] overflow-y-auto p-1 z-[100]"
          >
            {filtered.length > 0 ? (
              <div>
                {filtered.map(opt => (
                  <div
                    key={opt}
                    className="px-3 py-2 cursor-pointer font-serif-body text-sm text-ink hover:bg-accent/5 hover:text-accent transition-colors"
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
              <div className="px-4 py-3 flex items-center gap-2 text-muted">
                <Sparkles className="w-3.5 h-3.5" />
                <p className="font-mono text-[10px] tracking-[0.12em] uppercase">New entry</p>
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
         className="w-full min-h-[48px] bg-panel border border-rule focus-within:border-ink transition-colors p-2 flex flex-wrap gap-1.5 items-center cursor-text relative pr-10"
         onClick={() => setIsOpen(true)}
       >
         <AnimatePresence>
           {values.map(v => (
             <motion.div
               layout
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               key={v} title={v}
               className="flex items-center gap-1.5 bg-ink text-paper font-mono text-[10px] tracking-[0.1em] uppercase pl-2.5 pr-1.5 py-1 max-w-full group"
             >
               <span className="truncate max-w-[140px]">{v}</span>
               <button
                 type="button"
                 className="p-0.5 hover:text-accent transition-colors"
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
           className="flex-1 min-w-[80px] bg-transparent outline-none px-2 text-sm font-serif-body text-ink placeholder:text-muted/50"
         />
         <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
           <ChevronDown className="w-4 h-4" />
         </div>
       </div>

       <AnimatePresence>
         {isOpen && (
           <motion.div
             initial={{ opacity: 0, y: 4 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 4 }}
             className="absolute top-full left-0 w-full mt-1 bg-paper border border-rule max-h-[240px] overflow-y-auto p-1 z-[100]"
           >
             {filtered.length > 0 ? (
               <div>
                 {filtered.map(opt => (
                   <div
                     key={opt}
                     className="px-3 py-2 cursor-pointer font-serif-body text-sm text-ink hover:bg-accent/5 hover:text-accent transition-colors"
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
               <div className="px-4 py-3 text-muted font-serif-body italic text-xs">
                 No matches found.
               </div>
             )}
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}
