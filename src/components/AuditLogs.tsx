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

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filter !== 'all' && log.action !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return log.details.toLowerCase().includes(q) || log.type.toLowerCase().includes(q) || log.user.toLowerCase().includes(q);
      }
      return true;
    });
  }, [logs, search, filter]);

  const actionStyles: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
    ADD: { icon: <ShieldCheck className="w-3 h-3" />, color: 'text-good', bg: 'bg-good/5', border: 'border-good/20' },
    UPDATE: { icon: <Clock className="w-3 h-3" />, color: 'text-accent', bg: 'bg-accent/5', border: 'border-accent/20' },
    DELETE: { icon: <Trash2 className="w-3 h-3" />, color: 'text-bad', bg: 'bg-bad/5', border: 'border-bad/20' },
    TASK_LINK: { icon: <Terminal className="w-3 h-3" />, color: 'text-accent', bg: 'bg-accent/5', border: 'border-accent/20' }
  };

  return (
    <div className="flex flex-col h-[500px] bg-paper overflow-hidden font-mono">
      {/* Terminal Header */}
      <div className="px-5 py-3 border-b border-rule flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-bad/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-accent/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-good/40" />
          </div>
          <div className="h-3 w-px bg-rule mx-2" />
          <div className="flex items-center gap-2 text-muted">
            <Terminal className="w-3.5 h-3.5" />
            <span className="text-[10px] tracking-[0.16em] uppercase">audit.stream</span>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="p-1.5 hover:bg-panel text-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </button>
      </div>

      {/* Controls */}
      <div className="px-5 py-3 border-b border-rule flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="grep records..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-panel border border-rule text-[11px] text-good placeholder:text-muted/50 outline-none focus:border-ink transition-colors font-mono"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'ADD', 'UPDATE', 'DELETE'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-1 text-[9px] tracking-[0.1em] uppercase border transition-colors",
                filter === f
                  ? "bg-ink text-paper border-ink"
                  : "bg-panel border-rule text-muted hover:border-ink hover:text-ink"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Viewport */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="h-full flex items-center justify-center">
               <Loader2 className="w-6 h-6 text-muted animate-spin" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted italic text-xs">
               <AlertCircle className="w-6 h-6 opacity-30 mb-2" />
               No records found
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(idx * 0.01, 0.2) }}
                className="group flex items-start gap-3 text-[11px]"
              >
                <span className="text-ink shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-1.5 py-0.5 text-[8px] tracking-[0.1em] uppercase border",
                      actionStyles[log.action]?.color ?? 'text-muted',
                      actionStyles[log.action]?.bg ?? 'bg-panel',
                      actionStyles[log.action]?.border ?? 'border-rule'
                    )}>
                      {log.action}
                    </span>
                    <span className="text-good">{log.user}</span>
                    <span className="text-muted">{"->"}</span>
                    <span className="text-muted capitalize">{log.type.replace('-', ' ')}</span>
                  </div>
                  <p className="text-muted leading-relaxed break-words">{log.details}</p>
                  <div className="pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                    <span className="text-[9px] text-ink">ref:</span>
                    <code className="text-[9px] text-muted bg-panel px-1 py-0.5">ID_{log.targetId.slice(-6)}</code>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-5 py-2 border-t border-rule flex items-center justify-between text-[9px] text-muted tracking-[0.1em] uppercase">
        <span>progoffice audit v4.0</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-good" />
            Active
          </span>
          <span>Buffer: {logs.length}/1000</span>
        </div>
      </div>
    </div>
  );
}
