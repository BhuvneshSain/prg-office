import { useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, X, Loader2, CheckCircle2, Edit2 } from 'lucide-react';
import type { SettingsData } from '../types';
import { saveSettings as saveDropboxSettings } from '../lib/dropbox';

export default function Settings({ settings, onSettingsChange }: { settings: SettingsData, onSettingsChange: () => void }) {
  const [departments, setDepartments] = useState<string[]>(settings.departments);
  const [projects, setProjects] = useState<string[]>(settings.projects);
  const [newDept, setNewDept] = useState('');
  const [newProject, setNewProject] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editingDept, setEditingDept] = useState<{old: string, new: string} | null>(null);
  const [editingProject, setEditingProject] = useState<{old: string, new: string} | null>(null);

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

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDept.trim() && !departments.includes(newDept.trim())) {
      setDepartments([...departments, newDept.trim()]);
    }
    setNewDept('');
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.trim() && !projects.includes(newProject.trim())) {
      setProjects([...projects, newProject.trim()]);
    }
    setNewProject('');
  };

  const handleRemoveDept = (dept: string) => setDepartments(departments.filter(d => d !== dept));
  const handleRemoveProject = (proj: string) => setProjects(projects.filter(p => p !== proj));

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    
    const newSettings: SettingsData = { departments, projects };
    const ok = await saveDropboxSettings(newSettings);
    
    if (ok) {
      setSuccess(true);
      onSettingsChange();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert('Failed to save settings.');
    }
    setSaving(false);
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8 w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
           <SettingsIcon className="w-6 h-6 text-indigo-500" /> Master Data Management
        </h2>
        
        <button 
           onClick={handleSave}
           disabled={saving}
           className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all active:scale-95"
        >
           {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : success ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
           {saving ? 'Saving...' : success ? 'Saved!' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        
        {/* Departments Section */}
        <div className="space-y-4">
           <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-100 pb-2">Central Departments</h3>
           <p className="text-xs text-slate-500">Manage all fixed Recipient and Sender departments natively available in your registries.</p>
           
           <form onSubmit={handleAddDept} className="flex gap-2">
             <input 
               type="text" required placeholder="Add department name..."
               value={newDept} onChange={(e) => setNewDept(e.target.value)}
               className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm"
             />
             <button type="submit" className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"><Plus className="w-5 h-5"/></button>
           </form>

           <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
             {departments.length === 0 && <p className="text-sm text-slate-400 italic">No departments configured yet.</p>}
             {departments.map(dept => (
               <div key={dept} className="flex items-center justify-between bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm hover:border-slate-300 transition-colors group">
                 {editingDept?.old === dept ? (
                   <div className="flex-1 flex gap-2 mr-2">
                     <input 
                       autoFocus
                       className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                       value={editingDept.new}
                       onChange={(e) => setEditingDept({ ...editingDept, new: e.target.value })}
                       onKeyDown={(e) => e.key === 'Enter' && handleUpdateDept(dept, editingDept.new)}
                       onBlur={() => handleUpdateDept(dept, editingDept.new)}
                     />
                   </div>
                 ) : (
                   <span className="text-slate-700 font-medium text-sm flex-1">{dept}</span>
                 )}
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   {!editingDept && (
                     <button onClick={() => setEditingDept({ old: dept, new: dept })} className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
                       <Edit2 className="w-4 h-4" />
                     </button>
                   )}
                   <button onClick={() => handleRemoveDept(dept)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                     <X className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
           <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-100 pb-2">Master Projects</h3>
           <p className="text-xs text-slate-500">Manage all official Projects. This list propagates across Inward, Outward and Orders registries.</p>
           
           <form onSubmit={handleAddProject} className="flex gap-2">
             <input 
               type="text" required placeholder="Add project name..."
               value={newProject} onChange={(e) => setNewProject(e.target.value)}
               className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all placeholder:text-slate-400 text-sm"
             />
             <button type="submit" className="p-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors"><Plus className="w-5 h-5"/></button>
           </form>

           <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
             {projects.length === 0 && <p className="text-sm text-slate-400 italic">No projects configured yet.</p>}
             {projects.map(proj => (
               <div key={proj} className="flex items-center justify-between bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-sm hover:border-slate-300 transition-colors group">
                 {editingProject?.old === proj ? (
                   <div className="flex-1 flex gap-2 mr-2">
                     <input 
                       autoFocus
                       className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm outline-none focus:border-amber-500"
                       value={editingProject.new}
                       onChange={(e) => setEditingProject({ ...editingProject, new: e.target.value })}
                       onKeyDown={(e) => e.key === 'Enter' && handleUpdateProject(proj, editingProject.new)}
                       onBlur={() => handleUpdateProject(proj, editingProject.new)}
                     />
                   </div>
                 ) : (
                   <span className="text-slate-700 font-medium text-sm flex-1">{proj}</span>
                 )}
                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   {!editingProject && (
                     <button onClick={() => setEditingProject({ old: proj, new: proj })} className="text-slate-400 hover:text-amber-600 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
                       <Edit2 className="w-4 h-4" />
                     </button>
                   )}
                   <button onClick={() => handleRemoveProject(proj)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                     <X className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
