import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, Loader2, CheckCircle2, Edit2, Building2, FolderOpen, Briefcase, Sparkles, Database, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SettingsData } from '../types';
import { saveSettings as saveDropboxSettings } from '../lib/dataService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Settings({ settings, onSettingsChange }: { settings: SettingsData, onSettingsChange: () => void }) {
  const [departments, setDepartments] = useState<string[]>(settings.departments);
  const [projects, setProjects] = useState<string[]>(settings.projects);
  const [posts, setPosts] = useState<string[]>(settings.posts ?? []);
  const [newDept, setNewDept] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newPost, setNewPost] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editingDept, setEditingDept] = useState<{old: string, new: string} | null>(null);
  const [editingProject, setEditingProject] = useState<{old: string, new: string} | null>(null);
  const [editingPost, setEditingPost] = useState<{old: string, new: string} | null>(null);

  const handleUpdateDept = (oldName: string, newName: string) => {
    if (!newName.trim()) return setEditingDept(null);
    setDepartments(departments.map(d => d === oldName ? newName.trim() : d));
    setEditingDept(null);
  };
  const handleUpdateProject = (oldName: string, newName: string) => {
    if (!newName.trim()) return setEditingProject(null);
    setProjects(projects.map(p => p === oldName ? newName.trim() : p));
    setEditingProject(null);
  };
  const handleUpdatePost = (oldName: string, newName: string) => {
    if (!newName.trim()) return setEditingPost(null);
    setPosts(posts.map(p => p === oldName ? newName.trim() : p));
    setEditingPost(null);
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDept.trim() && !departments.includes(newDept.trim())) setDepartments([...departments, newDept.trim()]);
    setNewDept('');
  };
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.trim() && !projects.includes(newProject.trim())) setProjects([...projects, newProject.trim()]);
    setNewProject('');
  };
  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim() && !posts.includes(newPost.trim())) setPosts([...posts, newPost.trim()]);
    setNewPost('');
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    const newSettings: SettingsData = { departments, projects, posts };
    const ok = await saveDropboxSettings(newSettings);
    if (ok) { 
      setSuccess(true); 
      onSettingsChange(); 
      setTimeout(() => setSuccess(false), 3000); 
    }
    else alert('Security Protocol Failure: Synchronization interrupted.');
    setSaving(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 pb-20">
      {/* Settings Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[40px] border-white/60 shadow-glass overflow-hidden"
      >
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/40">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[28px] bg-cyber-violet/10 flex items-center justify-center shadow-inner">
              <SettingsIcon className="w-8 h-8 text-cyber-violet animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-3.5 h-3.5 text-cyber-violet" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Master Control</p>
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Core Parameters</h2>
              <p className="text-slate-400 text-sm font-bold mt-2">Manage taxonomies, mission projects, and operational ranks.</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave} 
            disabled={saving}
            className={cn(
              "flex items-center justify-center gap-3 px-8 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl transition-all relative overflow-hidden group min-w-[200px]",
              success ? "bg-emerald-500 shadow-emerald-500/20 text-white" : "bg-slate-900 shadow-slate-900/10 text-white"
            )}
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : success ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Synchronizing...' : success ? 'Database Updated' : 'Commit All Changes'}
          </motion.button>
        </div>
      </motion.div>

      {/* Grid Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <MasterSection
          title="Departments"
          icon={<Building2 className="w-5 h-5" />}
          accent="violet" 
          items={departments} 
          newValue={newDept}
          onNewChange={setNewDept} onAdd={handleAddDept}
          onRemove={(name: string) => setDepartments(departments.filter(d => d !== name))}
          editing={editingDept}
          onEditStart={(dept: string) => setEditingDept({ old: dept, new: dept })}
          onEditChange={(val: string) => editingDept && setEditingDept({ ...editingDept, new: val })}
          onEditSave={(dept: string) => handleUpdateDept(dept, editingDept?.new ?? '')}
          placeholder="New Sector..." 
          emptyMsg="No departments indexed."
          delay={0.1}
        />
        <MasterSection
          title="Active Projects"
          icon={<FolderOpen className="w-5 h-5" />}
          accent="amber" 
          items={projects} 
          newValue={newProject}
          onNewChange={setNewProject} onAdd={handleAddProject}
          onRemove={(name: string) => setProjects(projects.filter(p => p !== name))}
          editing={editingProject}
          onEditStart={(proj: string) => setEditingProject({ old: proj, new: proj })}
          onEditChange={(val: string) => editingProject && setEditingProject({ ...editingProject, new: val })}
          onEditSave={(proj: string) => handleUpdateProject(proj, editingProject?.new ?? '')}
          placeholder="New Mission..." 
          emptyMsg="No projects active."
          delay={0.2}
        />
        <MasterSection
          title="Operational Ranks"
          icon={<Briefcase className="w-5 h-5" />}
          accent="emerald" 
          items={posts} 
          newValue={newPost}
          onNewChange={setNewPost} onAdd={handleAddPost}
          onRemove={(name: string) => setPosts(posts.filter(p => p !== name))}
          editing={editingPost}
          onEditStart={(post: string) => setEditingPost({ old: post, new: post })}
          onEditChange={(val: string) => editingPost && setEditingPost({ ...editingPost, new: val })}
          onEditSave={(post: string) => handleUpdatePost(post, editingPost?.new ?? '')}
          placeholder="New Rank..." 
          emptyMsg="No ranks defined."
          delay={0.3}
        />
      </div>
    </div>
  );
}

interface MasterSectionProps {
  title: string;
  icon: React.ReactNode;
  accent: 'violet' | 'amber' | 'emerald';
  items: string[];
  newValue: string;
  onNewChange: (val: string) => void;
  onAdd: (e: React.FormEvent) => void;
  onRemove: (name: string) => void;
  editing: { old: string; new: string } | null;
  onEditStart: (item: string) => void;
  onEditChange: (val: string) => void;
  onEditSave: (item: string) => void;
  placeholder: string;
  emptyMsg: string;
  delay: number;
}

function MasterSection({ title, icon, accent, items, newValue, onNewChange, onAdd, onRemove, editing, onEditStart, onEditChange, onEditSave, placeholder, emptyMsg, delay }: MasterSectionProps) {
  const styles = {
    violet: { 
      icon: "bg-cyber-violet/10 text-cyber-violet",
      btn: "bg-cyber-violet text-white",
      focus: "focus:ring-cyber-violet/5 focus:border-cyber-violet"
    },
    amber: { 
      icon: "bg-amber-50 text-amber-500",
      btn: "bg-amber-500 text-white",
      focus: "focus:ring-amber-500/5 focus:border-amber-500"
    },
    emerald: { 
      icon: "bg-emerald-50 text-emerald-500",
      btn: "bg-emerald-500 text-white",
      focus: "focus:ring-emerald-500/5 focus:border-emerald-500"
    },
  }[accent];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card rounded-[40px] border-white/60 shadow-glass flex flex-col h-[500px]"
    >
      <div className="p-8 border-b border-white/40 bg-white/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", styles.icon)}>
            {icon}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 tracking-tight">{title}</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Master Records</p>
          </div>
        </div>
        <span className="text-[10px] font-black bg-white border border-slate-100 text-slate-400 px-3 py-1.5 rounded-xl shadow-sm">
          {items.length} Units
        </span>
      </div>

      <div className="p-8 flex flex-col h-full overflow-hidden">
        <form onSubmit={onAdd} className="flex gap-2 mb-8 group">
          <input
            type="text" required placeholder={placeholder} value={newValue}
            onChange={e => onNewChange(e.target.value)}
            className={cn(
              "flex-1 px-5 py-3.5 bg-white/60 border border-slate-200/60 rounded-[22px] outline-none text-sm font-bold text-slate-800 transition-all placeholder:text-slate-300",
              styles.focus
            )}
          />
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            type="submit" 
            className={cn("p-4 rounded-[22px] shadow-lg transition-colors flex-shrink-0", styles.btn)}
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </form>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <div className="w-16 h-16 rounded-[22px] bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{emptyMsg}</p>
              </motion.div>
            ) : (
              items.map((item: string, idx: number) => (
                <motion.div 
                  key={item} 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center justify-between bg-white/40 border border-slate-100/50 px-5 py-4 rounded-[24px] group hover:bg-white hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/40 transition-all cursor-default"
                >
                  {editing?.old === item ? (
                    <div className="flex-1 flex gap-2">
                       <input 
                        autoFocus 
                        className={cn(
                          "flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 outline-none",
                          styles.focus
                        )} 
                        value={editing.new} 
                        onChange={e => onEditChange(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && onEditSave(item)} 
                        onBlur={() => onEditSave(item)} 
                      />
                    </div>
                  ) : (
                    <span className="text-slate-800 font-black text-sm tracking-tight flex-1 truncate">{item}</span>
                  )}
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    {!editing && (
                      <button 
                        onClick={() => onEditStart(item)} 
                        className="p-2 rounded-xl text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => onRemove(item)} 
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
