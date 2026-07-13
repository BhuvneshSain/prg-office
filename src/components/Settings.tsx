import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, Loader2, CheckCircle2, Edit2, Building2, FolderOpen, Briefcase, Sparkles, Trash2 } from 'lucide-react';
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
  const [whatsappServerUrl, setWhatsappServerUrl] = useState(settings.whatsappServerUrl ?? 'http://localhost:8786');
  const [whatsappApiKey, setWhatsappApiKey] = useState(settings.whatsappApiKey ?? '');
  const [whatsappRecipientPhone, setWhatsappRecipientPhone] = useState(settings.whatsappRecipientPhone ?? '');
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

    // Apply any active edits that haven't been blurred/committed to local state yet
    let currentDepts = departments;
    if (editingDept && editingDept.new.trim()) {
      currentDepts = departments.map(d => d === editingDept.old ? editingDept.new.trim() : d);
    }
    let currentProjects = projects;
    if (editingProject && editingProject.new.trim()) {
      currentProjects = projects.map(p => p === editingProject.old ? editingProject.new.trim() : p);
    }
    let currentPosts = posts;
    if (editingPost && editingPost.new.trim()) {
      currentPosts = posts.map(p => p === editingPost.old ? editingPost.new.trim() : p);
    }

    const newSettings: SettingsData = { 
      departments: currentDepts, 
      projects: currentProjects, 
      posts: currentPosts,
      whatsappServerUrl: whatsappServerUrl.trim() || undefined,
      whatsappApiKey: whatsappApiKey.trim() || undefined,
      whatsappRecipientPhone: whatsappRecipientPhone.trim() || undefined
    };
    const ok = await saveDropboxSettings(newSettings);
    if (ok) {
      if (editingDept && editingDept.new.trim()) setDepartments(currentDepts);
      if (editingProject && editingProject.new.trim()) setProjects(currentProjects);
      if (editingPost && editingPost.new.trim()) setPosts(currentPosts);

      setEditingDept(null);
      setEditingProject(null);
      setEditingPost(null);

      setSuccess(true);
      onSettingsChange();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert('Sync failed.');
    }
    setSaving(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="border border-rule p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <SettingsIcon className="w-6 h-6 text-muted" />
          <div>
            <h2 className="font-serif-display italic text-2xl leading-none">Core Parameters</h2>
            <p className="font-serif-body text-muted text-sm mt-1">Manage departments, projects, and ranks.</p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3 font-mono text-[11px] tracking-[0.18em] uppercase transition-all min-w-[180px]",
            success ? "bg-good text-paper" : "bg-ink text-paper hover:bg-ink/90"
          )}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : success ? 'Saved' : 'Commit Changes'}
        </motion.button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MasterSection
          title="Departments"
          icon={<Building2 className="w-4 h-4" />}
          items={departments}
          newValue={newDept}
          onNewChange={setNewDept} onAdd={handleAddDept}
          onRemove={(name: string) => setDepartments(departments.filter(d => d !== name))}
          editing={editingDept}
          onEditStart={(dept: string) => setEditingDept({ old: dept, new: dept })}
          onEditChange={(val: string) => editingDept && setEditingDept({ ...editingDept, new: val })}
          onEditSave={(dept: string) => handleUpdateDept(dept, editingDept?.new ?? '')}
          placeholder="New department..."
          emptyMsg="No departments indexed."
        />
        <MasterSection
          title="Active Projects"
          icon={<FolderOpen className="w-4 h-4" />}
          items={projects}
          newValue={newProject}
          onNewChange={setNewProject} onAdd={handleAddProject}
          onRemove={(name: string) => setProjects(projects.filter(p => p !== name))}
          editing={editingProject}
          onEditStart={(proj: string) => setEditingProject({ old: proj, new: proj })}
          onEditChange={(val: string) => editingProject && setEditingProject({ ...editingProject, new: val })}
          onEditSave={(proj: string) => handleUpdateProject(proj, editingProject?.new ?? '')}
          placeholder="New project..."
          emptyMsg="No projects active."
        />
        <MasterSection
          title="Operational Ranks"
          icon={<Briefcase className="w-4 h-4" />}
          items={posts}
          newValue={newPost}
          onNewChange={setNewPost} onAdd={handleAddPost}
          onRemove={(name: string) => setPosts(posts.filter(p => p !== name))}
          editing={editingPost}
          onEditStart={(post: string) => setEditingPost({ old: post, new: post })}
          onEditChange={(val: string) => editingPost && setEditingPost({ ...editingPost, new: val })}
          onEditSave={(post: string) => handleUpdatePost(post, editingPost?.new ?? '')}
          placeholder="New rank..."
          emptyMsg="No ranks defined."
        />
      </div>

      {/* WhatsApp Configuration */}
      <div className="border border-rule p-6 space-y-4">
        <h3 className="font-serif-display text-xl tracking-tight">go-wppserver WhatsApp Integration</h3>
        <p className="font-serif-body text-xs text-muted leading-relaxed">
          Configure automated WhatsApp notifications for task assignments. Enter your running <code>go-wppserver</code> instance (local or hosted in the cloud, e.g. on Hugging Face Spaces) and the authentication credentials.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-mono text-[10px] text-muted tracking-wider uppercase mb-1.5">go-wppserver URL</label>
            <input
              type="text"
              value={whatsappServerUrl}
              onChange={(e) => setWhatsappServerUrl(e.target.value)}
              placeholder="http://localhost:8786"
              className="w-full px-3 py-2 border border-rule bg-[var(--input-bg)] text-ink font-mono text-sm focus:border-accent outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] text-muted tracking-wider uppercase mb-1.5">API Key / Access Token</label>
            <input
              type="password"
              value={whatsappApiKey}
              onChange={(e) => setWhatsappApiKey(e.target.value)}
              placeholder="Enter JWT / Access Token"
              className="w-full px-3 py-2 border border-rule bg-[var(--input-bg)] text-ink font-mono text-sm focus:border-accent outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] text-muted tracking-wider uppercase mb-1.5">Backup Recipient Phone Number</label>
            <input
              type="text"
              value={whatsappRecipientPhone}
              onChange={(e) => setWhatsappRecipientPhone(e.target.value)}
              placeholder="+919988776655"
              className="w-full px-3 py-2 border border-rule bg-[var(--input-bg)] text-ink font-mono text-sm focus:border-accent outline-none"
            />
          </div>
        </div>
        <p className="font-mono text-[10px] text-muted leading-normal">
          * Ensure your WhatsApp account is connected by visiting the Swagger interface on your server (e.g. <code className="bg-rule/30 px-1 font-semibold text-accent">{whatsappServerUrl || 'http://localhost:8786'}/docs/api/</code>) and logging in via the <code className="bg-rule/30 px-1 font-semibold text-accent">/device/login</code> route.
        </p>
      </div>
    </div>
  );
}

interface MasterSectionProps {
  title: string;
  icon: React.ReactNode;
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
}

function MasterSection({ title, icon, items, newValue, onNewChange, onAdd, onRemove, editing, onEditStart, onEditChange, onEditSave, placeholder, emptyMsg }: MasterSectionProps) {
  return (
    <div className="border border-rule flex flex-col h-[460px]">
      <div className="px-5 py-4 border-b border-rule bg-panel flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="text-muted">{icon}</div>
          <div>
            <h3 className="font-serif-display italic text-base">{title}</h3>
            <p className="font-mono text-[9px] text-muted tracking-[0.16em] uppercase mt-0.5">Master records</p>
          </div>
        </div>
        <span className="font-mono text-[10px] text-muted border border-rule px-2 py-0.5">
          {items.length}
        </span>
      </div>

      <div className="p-4 flex flex-col h-full overflow-hidden">
        <form onSubmit={onAdd} className="flex gap-2 mb-4">
          <input
            type="text" required placeholder={placeholder} value={newValue}
            onChange={e => onNewChange(e.target.value)}
            className="flex-1 px-3 py-2.5 bg-panel border border-rule text-sm font-serif-body text-ink placeholder:text-muted/50 outline-none focus:border-ink transition-colors"
          />
          <button
            type="submit"
            className="p-2.5 bg-ink text-paper hover:bg-ink/90 transition-colors flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-10 text-center"
              >
                <Sparkles className="w-6 h-6 text-muted mx-auto mb-3 opacity-40" />
                <p className="font-mono text-[10px] text-muted tracking-[0.12em] uppercase">{emptyMsg}</p>
              </motion.div>
            ) : (
              items.map((item: string, idx: number) => (
                <motion.div
                  key={item}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-center justify-between border border-rule px-4 py-2.5 group hover:border-ink transition-colors"
                >
                  {editing?.old === item ? (
                    <input
                      autoFocus
                      className="flex-1 px-2 py-1 bg-panel border border-rule text-sm font-serif-body text-ink outline-none focus:border-ink"
                      value={editing.new}
                      onChange={e => onEditChange(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && onEditSave(item)}
                      onBlur={() => onEditSave(item)}
                    />
                  ) : (
                    <span className="font-serif-body text-sm text-ink flex-1 truncate">{item}</span>
                  )}

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!editing && (
                      <button
                        onClick={() => onEditStart(item)}
                        className="p-1.5 text-muted hover:text-ink transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(item)}
                      className="p-1.5 text-muted hover:text-bad transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
