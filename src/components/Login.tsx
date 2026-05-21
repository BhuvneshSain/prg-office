import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginProps {
  onLogin: (username: string, passwordHash: string) => Promise<boolean>;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-[400px] w-full"
      >
        {/* Brand */}
        <div className="mb-10 text-center">
          <h1 className="font-serif-display italic text-3xl tracking-tight">
            prog<span className="text-accent">office</span>
          </h1>
          <p className="font-mono text-[10px] text-muted tracking-[0.18em] uppercase mt-2">Office Register Suite</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] text-muted tracking-[0.18em] uppercase">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-panel border border-rule text-ink placeholder:text-muted/50 focus:outline-none focus:border-ink font-serif-body text-sm transition-colors"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] text-muted tracking-[0.18em] uppercase">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-panel border border-rule text-ink placeholder:text-muted/50 focus:outline-none focus:border-ink font-serif-body text-sm transition-colors"
                placeholder="Enter password"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3 border border-bad/30 bg-bad/5 flex items-center gap-2 text-bad"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="font-mono text-[11px] tracking-[0.1em]">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-paper font-mono text-[11px] tracking-[0.18em] uppercase py-4 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-ink/90"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-paper/30 border-t-paper rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center border-t border-rule pt-6">
          <p className="font-serif-display italic text-sm text-accent">progoffice</p>
          <p className="font-mono text-[9px] text-muted tracking-[0.1em] uppercase mt-1">
            register suite &middot; powered by dropbox
          </p>
        </div>
      </motion.div>
    </div>
  );
}
