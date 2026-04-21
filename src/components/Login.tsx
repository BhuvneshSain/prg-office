import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LoginProps {
  onLogin: (username: string, passwordHash: string) => Promise<boolean>;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to SHA-256 hash a string
  async function hashString(str: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in both fields.');
      return;
    }

    setLoading(true);
    try {
      const passwordHash = await hashString(password);
      const success = await onLogin(username, passwordHash);
      if (!success) {
        setError('Incorrect username or password.');
      }
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.15, 0.1],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-cyber-violet/20 blur-[120px] rounded-full pointer-events-none" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.12, 0.1],
          rotate: [0, -90, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyber-cyan/20 blur-[120px] rounded-full pointer-events-none" 
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
        className="max-w-[440px] w-full relative z-10"
      >
        <div className="glass-card rounded-[40px] border-white/60 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          {/* Top Pattern */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyber-violet/5 to-cyber-cyan/5 rounded-bl-[100px] pointer-events-none" />
          
          <div className="mb-12 text-center relative z-10">
            <motion.div 
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.8, delay: 0.2 }}
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="w-16 h-16 bg-gradient-to-br from-cyber-violet to-cyber-cyan rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-cyber-violet/20 group cursor-pointer"
            >
              <span className="text-white font-black text-2xl tracking-tighter">POS</span>
            </motion.div>
            
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">
              Welcome<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-violet to-cyber-cyan">Back</span>
            </h1>
            <p className="text-slate-400 text-sm mt-3 font-bold uppercase tracking-widest leading-none flex items-center justify-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Gateway
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Operator ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors text-slate-300 group-focus-within:text-cyber-violet">
                  <User className="w-5 h-5 transition-transform group-focus-within:scale-110" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-white/40 border border-slate-200/60 rounded-[22px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet focus:bg-white transition-all font-bold text-sm"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Security Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors text-slate-300 group-focus-within:text-cyber-violet">
                  <Lock className="w-5 h-5 transition-transform group-focus-within:scale-110" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-white/40 border border-slate-200/60 rounded-[22px] text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-cyber-violet/5 focus:border-cyber-violet focus:bg-white transition-all font-bold text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-red-50/80 backdrop-blur-md border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-black tracking-tight">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-black py-5 rounded-[22px] shadow-xl shadow-slate-900/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-violet to-cyber-cyan opacity-0 group-hover:opacity-10 transition-opacity" />
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="tracking-tight">Authorize Access</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-12 text-center pt-8 border-t border-slate-100/50">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-violet/40" />
              Cloud Secured Terminal
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan/40" />
            </p>
          </div>
        </div>
        
        {/* Version label */}
        <p className="text-center mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
          Programmer Suite v2.1.0 • Stable Build
        </p>
      </motion.div>
    </div>
  );
}
