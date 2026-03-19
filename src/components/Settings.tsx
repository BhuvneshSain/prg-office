import { useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, X, Loader2, CheckCircle2, Edit2, Building2, FolderOpen, Briefcase } from 'lucide-react';
import type { SettingsData } from '../types';
import { saveSettings as saveDropboxSettings } from '../lib/dropbox';

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
    if (ok) { setSuccess(true); onSettingsChange(); setTimeout(() => setSuccess(false), 3000); }
    else alert('Failed to save settings to Dropbox.');
    setSaving(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl">
            <SettingsIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Master Data Management</h2>
            <p className="text-xs text-slate-500">Manage departments, projects and staff posts</p>
          </div>
        </div>
        <button
          onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white px-4 py-2 rounded-xl font-semibold text-sm shadow-sm transition-all active:scale-95"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : success ? 'Saved!' : 'Save All'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MasterSection
          title="Departments"
          icon={<Building2 className="w-4 h-4 text-indigo-500" />}
          accent="indigo" items={departments} newValue={newDept}
          onNewChange={setNewDept} onAdd={handleAddDept}
          onRemove={(name: string) => setDepartments(departments.filter(d => d !== name))}
          editing={editingDept}
          onEditStart={(dept: string) => setEditingDept({ old: dept, new: dept })}
          onEditChange={(val: string) => editingDept && setEditingDept({ ...editingDept, new: val })}
          onEditSave={(dept: string) => handleUpdateDept(dept, editingDept?.new ?? '')}
          placeholder="Add department..." emptyMsg="No departments configured."
        />
        <MasterSection
          title="Projects"
          icon={<FolderOpen className="w-4 h-4 text-amber-500" />}
          accent="amber" items={projects} newValue={newProject}
          onNewChange={setNewProject} onAdd={handleAddProject}
          onRemove={(name: string) => setProjects(projects.filter(p => p !== name))}
          editing={editingProject}
          onEditStart={(proj: string) => setEditingProject({ old: proj, new: proj })}
          onEditChange={(val: string) => editingProject && setEditingProject({ ...editingProject, new: val })}
          onEditSave={(proj: string) => handleUpdateProject(proj, editingProject?.new ?? '')}
          placeholder="Add project..." emptyMsg="No projects configured."
        />
        <MasterSection
          title="Staff Posts"
          icon={<Briefcase className="w-4 h-4 text-emerald-500" />}
          accent="emerald" items={posts} newValue={newPost}
          onNewChange={setNewPost} onAdd={handleAddPost}
          onRemove={(name: string) => setPosts(posts.filter(p => p !== name))}
          editing={editingPost}
          onEditStart={(post: string) => setEditingPost({ old: post, new: post })}
          onEditChange={(val: string) => editingPost && setEditingPost({ ...editingPost, new: val })}
          onEditSave={(post: string) => handleUpdatePost(post, editingPost?.new ?? '')}
          placeholder="Add designation..." emptyMsg="No posts configured."
        />
      </div>
    </div>
  );
}

function MasterSection({ title, icon, accent, items, newValue, onNewChange, onAdd, onRemove, editing, onEditStart, onEditChange, onEditSave, placeholder, emptyMsg }: any) {
  const ACCENT_MAP: Record<string, any> = {
    indigo: { btn: 'bg-indigo-600 hover:bg-indigo-700', ring: 'focus:ring-indigo-500/20 focus:border-indigo-500', border: 'hover:text-indigo-600', edit: 'focus:border-indigo-500' },
    amber: { btn: 'bg-amber-500 hover:bg-amber-600', ring: 'focus:ring-amber-500/20 focus:border-amber-500', border: 'hover:text-amber-600', edit: 'focus:border-amber-500' },
    emerald: { btn: 'bg-emerald-600 hover:bg-emerald-700', ring: 'focus:ring-emerald-500/20 focus:border-emerald-500', border: 'hover:text-emerald-600', edit: 'focus:border-emerald-500' },
  };
  const c = ACCENT_MAP[accent];
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4 flex flex-col">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        {icon}
        <h3 className="font-bold text-slate-700 text-sm">{title}</h3>
        <span className="ml-auto text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">{items.length}</span>
      </div>
      <form onSubmit={onAdd} className="flex gap-2">
        <input
          type="text" required placeholder={placeholder} value={newValue}
          onChange={e => onNewChange(e.target.value)}
          className={`flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm transition-all ${c.ring} placeholder:text-slate-400`}
        />
        <button type="submit" className={`p-2 ${c.btn} text-white rounded-xl transition-colors flex-shrink-0`}><Plus className="w-4 h-4" /></button>
      </form>
      <div className="flex flex-col gap-2 flex-1 max-h-[280px] overflow-y-auto pr-1">
        {items.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">{emptyMsg}</p>}
        {items.map((item: string) => (
          <div key={item} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-xl hover:border-slate-200 group">
            {editing?.old === item ? (
              <input autoFocus className={`flex-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-sm outline-none ${c.edit} mr-2`} value={editing.new} onChange={e => onEditChange(e.target.value)} onKeyDown={e => e.key === 'Enter' && onEditSave(item)} onBlur={() => onEditSave(item)} />
            ) : (
              <span className="text-slate-700 font-medium text-sm flex-1 truncate">{item}</span>
            )}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {!editing && <button onClick={() => onEditStart(item)} className={`p-1.5 rounded-lg text-slate-400 ${c.border} hover:bg-slate-100`}><Edit2 className="w-3.5 h-3.5" /></button>}
              <button onClick={() => onRemove(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"><X className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
