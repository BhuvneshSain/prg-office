import { useState, memo } from 'react';
import { 
  ClipboardList, Search, Plus, Calendar, Clock, AlertCircle, 
  CheckCircle2, Trash2, Pencil, ExternalLink, Filter, 
  Circle, LayoutGrid, List
} from 'lucide-react';
import type { TaskEntry, TaskStatus, TaskPriority } from '../types';
import { deleteTask } from '../lib/dataService';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskManagerProps {
  tasks: TaskEntry[];
  loading: boolean;
  onRefresh: () => void;
  onEdit: (task: TaskEntry) => void;
  onToggleStatus: (task: TaskEntry) => void;
  onViewDoc: (id: string, type: 'inward' | 'orders') => void;
  onNew: () => void;
}

const TaskManager = memo(function TaskManager({ tasks, loading, onRefresh, onEdit, onToggleStatus, onViewDoc, onNew }: TaskManagerProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase()) ||
      task.assignedTo.some(name => name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const ok = await deleteTask(id);
      if (ok) onRefresh();
    }
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-100';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'Medium': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    }
  };

  const getStatusIcon = (s: TaskStatus) => {
    switch (s) {
      case 'Completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Deferred': return <Circle className="w-4 h-4 text-slate-400" />;
      case 'Pending': return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Controls */}
      <div className="glass-card rounded-[32px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-white/40 shadow-glass bg-[var(--header-bg)] backdrop-blur-md">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border-primary)] rounded-[18px] bg-[var(--input-bg)] text-xs focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-[var(--text-muted)] font-medium" 
            />
          </div>
          
          <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--border-primary)]">
             <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === 'list' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600")}
             >
               <List className="w-4 h-4" />
             </button>
             <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-lg transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600")}
             >
               <LayoutGrid className="w-4 h-4" />
             </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
           <div className="flex items-center gap-2 pr-4 border-r border-slate-200/50">
             <Filter className="w-3.5 h-3.5 text-slate-400" />
             <select 
               value={statusFilter} 
               onChange={e => setStatusFilter(e.target.value as any)}
               className="text-[10px] font-black uppercase tracking-widest bg-transparent text-slate-600 outline-none"
             >
               <option value="All">All Status</option>
               <option value="Pending">Pending</option>
               <option value="In Progress">Working</option>
               <option value="Completed">Done</option>
               <option value="Deferred">Deferred</option>
             </select>
           </div>

           <motion.button 
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={onNew}
             className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10"
           >
             <Plus className="w-3.5 h-3.5" /> Initialize Task
           </motion.button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 animate-pulse">
          <ClipboardList className="w-10 h-10 text-slate-200" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Task Grid...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 glass-card rounded-[40px] border-dashed border-2 border-slate-200">
           <div className="w-16 h-16 rounded-[28px] bg-slate-50 flex items-center justify-center">
             <ClipboardList className="w-8 h-8 text-slate-200" />
           </div>
           <div className="text-center">
             <h4 className="font-black text-slate-700 tracking-tight">System Idle</h4>
             <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tight">No active directives found matching filters.</p>
           </div>
        </div>
      ) : (
        <div className={cn(
          "gap-6",
          viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
        )}>
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <TaskItem 
                key={task.id} 
                task={task} 
                viewMode={viewMode}
                onEdit={() => onEdit(task)} 
                onToggleStatus={() => onToggleStatus(task)}
                onViewDoc={() => task.linkedDocId && task.linkedDocType && onViewDoc(task.linkedDocId, task.linkedDocType)}
                onDelete={() => handleDelete(task.id)} 
                priorityStyles={getPriorityColor(task.priority)}
                statusIcon={getStatusIcon(task.status)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

function TaskItem({ task, viewMode, onEdit, onToggleStatus, onViewDoc, onDelete, priorityStyles, statusIcon }: { 
  task: TaskEntry; 
  viewMode: 'grid' | 'list';
  onEdit: () => void; 
  onToggleStatus: () => void;
  onViewDoc: () => void;
  onDelete: () => void; 
  priorityStyles: string;
  statusIcon: React.ReactNode;
}) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={cn(
        "glass-card p-6 rounded-[32px] border-white/60 shadow-glass flex relative overflow-hidden group",
        viewMode === 'list' ? "flex-row items-center gap-6" : "flex-col gap-4"
      )}
    >
      {/* Priority Indicator */}
      <div className={cn("absolute top-0 left-0 w-1.5 h-full", priorityStyles.split(' ')[2].replace('border-', 'bg-'))} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
           <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", priorityStyles)}>
             {task.priority}
           </span>
           <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
             <Calendar className="w-3 h-3" /> {task.dueDate || 'No Deadline'}
           </span>
        </div>
        
        <h4 className="text-lg font-black text-slate-800 tracking-tight truncate group-hover:text-indigo-600 transition-colors">
          {task.title}
        </h4>
        <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2">
          {task.description}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
           {task.assignedTo.map(name => (
             <span key={name} className="flex items-center gap-1.5 bg-white border border-slate-100 text-[10px] font-black px-2.5 py-1 rounded-xl text-slate-600 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> {name}
             </span>
           ))}
        </div>
      </div>

      <div className={cn(
        "flex gap-4 items-center",
        viewMode === 'list' ? "border-l border-slate-100 pl-6 shrink-0" : "mt-4 pt-4 border-t border-slate-100 justify-between"
      )}>
         <div className="flex items-center gap-2">
            {statusIcon}
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{task.status}</span>
         </div>

          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
           <button 
             onClick={onToggleStatus} 
             title={task.status === 'Completed' ? "Mark as Pending" : "Mark as Completed"}
             className={cn(
               "p-2 rounded-xl transition-colors",
               task.status === 'Completed' ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
             )}
           >
             <CheckCircle2 className="w-3.5 h-3.5" />
           </button>
           {task.linkedDocId && (
             <button 
               onClick={onViewDoc}
               title="View Linked Document" 
               className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
             >
               <ExternalLink className="w-3.5 h-3.5" />
             </button>
           )}
           <button onClick={onEdit} className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-200 transition-colors">
             <Pencil className="w-3.5 h-3.5" />
           </button>
           <button onClick={onDelete} className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
             <Trash2 className="w-3.5 h-3.5" />
           </button>
         </div>
      </div>
    </motion.div>
  );
}

export default TaskManager;
