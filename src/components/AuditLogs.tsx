import { useState, useEffect, useMemo } from 'react';
import { getAuditLogs } from '../lib/dataService';
import type { AuditEntry } from '../types';
import { Terminal, Search, Clock, ShieldCheck, AlertCircle, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'ADD' | 'UPDATE' | 'DELETE'>('all');

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getAuditLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filter !== 'all' && log.action !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          log.details.toLowerCase().includes(q) ||
          log.type.toLowerCase().includes(q) ||
          log.user.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, search, filter]);

  const actionStyles = {
    ADD: { icon: <ShieldCheck className="w-3.5 h-3.5" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    UPDATE: { icon: <Clock className="w-3.5 h-3.5" />, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    DELETE: { icon: <Trash2 className="w-3.5 h-3.5" />, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' }
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-950 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden font-mono">
      {/* Terminal Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
          </div>
          <div className="h-4 w-px bg-slate-700 mx-2" />
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">system.audit_stream</span>
          </div>
        </div>
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Terminal Controls */}
      <div className="px-6 py-4 bg-slate-900/30 border-b border-slate-800 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text"
            placeholder="grep records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-500 placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all font-mono"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'ADD', 'UPDATE', 'DELETE'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border transition-all",
                filter === f 
                  ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-500" 
                  : "bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-950/50">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="h-full flex items-center justify-center">
               <Loader2 className="w-8 h-8 text-emerald-500/20 animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-700 italic text-xs">
               <AlertCircle className="w-8 h-8 opacity-20 mb-3" />
               No records found in current segment
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.01, 0.2) }}
                className="group flex items-start gap-4 text-xs"
              >
                <span className="text-slate-700 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border",
                      actionStyles[log.action].color,
                      actionStyles[log.action].bg,
                      actionStyles[log.action].border
                    )}>
                      {log.action}
                    </span>
                    <span className="text-emerald-500 font-bold tracking-tight">{log.user}</span>
                    <span className="text-slate-600">{"->"}</span>
                    <span className="text-slate-400 capitalize">{log.type.replace('-', ' ')}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed break-words">
                    {log.details}
                  </p>
                  <div className="pt-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <span className="text-[9px] text-slate-700">target_ref:</span>
                    <code className="text-[9px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">ID_{log.targetId.slice(-6)}</code>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Terminal Footer */}
      <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-[9px] text-slate-600 font-bold uppercase tracking-widest">
        <span>Prg-Office Audit Node v4.0.0</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Stream Active
          </span>
          <span>Buffer: {logs.length}/1000</span>
        </div>
      </div>
    </div>
  );
}
