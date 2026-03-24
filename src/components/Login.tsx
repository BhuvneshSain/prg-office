import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

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
    } catch (err) {
      setError('An error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Ambient backgrounds */}
      <div className="absolute top-0 left-0 w-[40%] h-[30%] bg-indigo-400/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[30%] bg-purple-400/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
          {/* Subtle patterns */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-bl-full pointer-events-none" />
          
          <div className="mb-10 text-center relative z-10">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200 animate-in zoom-in-50 duration-500 delay-200">
              <span className="text-white font-black text-xl">POS</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Programmer Office Suite</h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">Please sign in to access your data</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors text-slate-300 group-focus-within:text-indigo-500">
                  <User className="w-[18px] h-[18px]" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-medium"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors text-slate-300 group-focus-within:text-indigo-500">
                  <Lock className="w-[18px] h-[18px]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-600 animate-in shake duration-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-xs font-bold leading-none">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 border-b-4 border-slate-950 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] active:border-b-0 active:mt-1 disabled:opacity-70 flex items-center justify-center gap-2 group overflow-hidden"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-50">
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              Secure Cloud Sync Powered by <span className="text-indigo-500 font-bold">Dropbox</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
