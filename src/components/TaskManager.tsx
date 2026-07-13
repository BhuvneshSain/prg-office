import { useState, memo } from 'react';
import { 
  ClipboardList, Search, Plus, Calendar, Clock, AlertCircle, 
  CheckCircle2, Trash2, Pencil, ExternalLink, Filter, 
  Circle, LayoutGrid, List, RefreshCw, MessageSquare
} from 'lucide-react';
import type { TaskEntry, TaskStatus, TaskPriority, RegisterEntry, SettingsData } from '../types';
import { deleteTask } from '../lib/dataService';
import { formatDate } from '../utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useDebounce } from '../hooks/useDebounce';

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
  staffData?: RegisterEntry[];
  settings?: SettingsData;
}

const TaskManager = memo(function TaskManager({ tasks, loading, onRefresh, onEdit, onToggleStatus, onViewDoc, onNew, staffData = [], settings }: TaskManagerProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'All'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFutureTasks, setShowFutureTasks] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const isTaskVisible = (task: TaskEntry): boolean => {
    if (showFutureTasks) return true;
    if (task.status !== 'Pending') return true;
    if (!task.isRecurring || !task.recurrenceInterval || task.recurrenceInterval === 'none') return true;
    if (!task.dueDate) return true;

    // Daily tasks: visible on or after due date
    if (task.recurrenceInterval === 'daily') {
      return todayStr >= task.dueDate;
    }

    // Weekly tasks: visible starting Monday of the week containing the due date
    if (task.recurrenceInterval === 'weekly') {
      const dateD = new Date(task.dueDate);
      if (isNaN(dateD.getTime())) return true;
      const day = dateD.getUTCDay();
      const mondayDate = new Date(dateD);
      mondayDate.setUTCDate(mondayDate.getUTCDate() - (day === 0 ? 6 : day - 1));
      const mondayStr = mondayDate.toISOString().split('T')[0];
      return todayStr >= mondayStr;
    }

    // Monthly tasks: visible starting 1st of the month containing the due date
    if (task.recurrenceInterval === 'monthly') {
      const parts = task.dueDate.split('-');
      if (parts.length < 3) return true;
      const startOfMonthStr = `${parts[0]}-${parts[1]}-01`;
      return todayStr >= startOfMonthStr;
    }

    return true;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      task.description.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      task.assignedTo.some(name => name.toLowerCase().includes(debouncedSearch.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    const matchesVisibility = isTaskVisible(task);
    
    return matchesSearch && matchesStatus && matchesVisibility;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      const ok = await deleteTask(id);
      if (ok) onRefresh();
    }
  };

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'Critical': return 'text-bad bg-bad/5 border-bad/20';
      case 'High': return 'text-accent bg-accent/5 border-accent/20';
      case 'Medium': return 'border border-rule text-muted';
      case 'Low': return 'text-muted bg-panel border-rule';
    }
  };

  const getStatusIcon = (s: TaskStatus) => {
    switch (s) {
      case 'Completed': return <CheckCircle2 className="w-4 h-4 text-good" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-accent" />;
      case 'Deferred': return <Circle className="w-4 h-4 text-muted" />;
      case 'Pending': return <AlertCircle className="w-4 h-4 text-accent" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Controls */}
      <div className="border border-rule p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--header-bg)]">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64 group">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-ink transition-colors" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border-primary)] bg-[var(--input-bg)] text-xs focus:border-ink outline-none transition-all placeholder:text-[var(--text-muted)] font-serif-body"
            />
          </div>
          
          <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1 border border-[var(--border-primary)]">
             <button
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 transition-all", viewMode === 'list' ? "bg-paper text-accent" : "text-muted hover:text-ink")}
             >
               <List className="w-4 h-4" />
             </button>
             <button
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 transition-all", viewMode === 'grid' ? "bg-paper text-accent" : "text-muted hover:text-ink")}
             >
               <LayoutGrid className="w-4 h-4" />
             </button>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <div className="flex items-center gap-2 pr-3 border-r border-[var(--border-primary)] shrink-0">
              <Filter className="w-3.5 h-3.5 text-muted" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as TaskStatus | 'All')}
                className="font-mono text-[11px] tracking-[0.18em] uppercase bg-transparent text-ink outline-none"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">Working</option>
                <option value="Completed">Done</option>
                <option value="Deferred">Deferred</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pr-3 border-r border-[var(--border-primary)] shrink-0 select-none">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFutureTasks}
                  onChange={e => setShowFutureTasks(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-rule text-accent bg-panel focus:ring-accent"
                />
                <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted hover:text-ink transition-colors">Future Tasks</span>
              </label>
            </div>

           <motion.button
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={onNew}
             className="flex items-center gap-2 bg-ink text-white px-4 py-2.5 font-mono text-[11px] tracking-[0.18em] uppercase shrink-0"
           >
             <Plus className="w-3.5 h-3.5" /> Initialize Task
           </motion.button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <ClipboardList className="w-10 h-10 text-muted" />
          <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted">Accessing Task Grid...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 border border-rule border-dashed">
           <div className="w-16 h-16 bg-panel flex items-center justify-center">
             <ClipboardList className="w-8 h-8 text-muted" />
           </div>
           <div className="text-center">
             <h4 className="font-serif-display text-ink tracking-tight">System Idle</h4>
             <p className="text-xs text-muted font-serif-body mt-1 uppercase tracking-tight">No active directives found matching filters.</p>
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
                staffData={staffData}
                settings={settings}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});

function TaskItem({ 
  task, viewMode, onEdit, onToggleStatus, onViewDoc, onDelete, priorityStyles, statusIcon, staffData = [], settings 
}: { 
  task: TaskEntry; 
  viewMode: 'grid' | 'list';
  onEdit: () => void; 
  onToggleStatus: () => void;
  onViewDoc: () => void;
  onDelete: () => void; 
  priorityStyles: string;
  statusIcon: React.ReactNode;
  staffData?: RegisterEntry[];
  settings?: SettingsData;
}) {
  const handleManualWhatsApp = () => {
    // Find the first assignee with a mobile number
    const firstAssignee = task.assignedTo
      .map(name => staffData.find(s => s.partyName === name))
      .find(staff => !!staff && !!staff.mobile);

    const targetPhone = firstAssignee?.mobile || settings?.whatsappRecipientPhone;
    if (!targetPhone) {
      alert("No phone number found for this assignee. Please configure their mobile in Staff Management, or add a default Recipient Phone in Settings.");
      return;
    }

    const messageText = `⚠️ *ProgOffice Task Reminder*
*Directive:* ${task.title}
*Priority:* ${task.priority}
*Due Date:* ${task.dueDate ? formatDate(task.dueDate) : 'No specific deadline'}
*Assigned To:* ${task.assignedTo.join(', ')}
_Description: ${task.description || 'No description provided.'}_`;

    const cleanPhone = targetPhone.replace(/[+\s-]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileHover={{ y: -2 }}
      className={cn(
        "border border-rule p-5 sm:p-6 flex relative overflow-hidden group",
        viewMode === 'list' ? "flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6" : "flex-col gap-4"
      )}
    >
      {/* Priority Indicator */}
      <div className={cn("absolute top-0 left-0 w-1.5 h-full", priorityStyles.split(' ')[2].replace('border-', 'bg-'))} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
           <span className={cn("font-mono text-[11px] tracking-[0.18em] uppercase px-2 py-0.5 border", priorityStyles)}>
             {task.priority}
           </span>
           <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-muted)] flex items-center gap-1">
             <Calendar className="w-3 h-3" /> {task.dueDate ? formatDate(task.dueDate) : 'No Deadline'}
           </span>
           {task.isRecurring && task.recurrenceInterval && task.recurrenceInterval !== 'none' && (
             <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent bg-accent/5 border border-accent/20 px-2 py-0.5 flex items-center gap-1.5 rounded-sm">
               <RefreshCw className="w-3 h-3 animate-[spin_4s_linear_infinite]" /> {task.recurrenceInterval}
             </span>
           )}
        </div>
        
        <h4 className="text-lg font-serif-display text-[var(--text-primary)] tracking-tight sm:truncate group-hover:text-accent transition-colors">
          {task.title}
        </h4>
        <p className="text-xs text-[var(--text-secondary)] font-serif-body mt-1 line-clamp-2">
          {task.description}
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
           {task.assignedTo.map(name => (
             <span key={name} className="flex items-center gap-1.5 bg-[var(--bg-surface)] border border-[var(--border-primary)] font-mono text-[11px] tracking-[0.18em] uppercase px-2.5 py-1 text-[var(--text-secondary)]">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" /> {name}
             </span>
           ))}
         </div>
      </div>

      <div className={cn(
        "flex gap-4 items-center",
        viewMode === 'list' ? "sm:border-l border-[var(--border-primary)] sm:pl-6 shrink-0" : "mt-2 sm:mt-4 pt-4 border-t border-[var(--border-primary)] justify-between"
      )}>
         <div className="flex items-center gap-2">
            {statusIcon}
            <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[var(--text-primary)]">{task.status}</span>
         </div>

          <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
           <button
             onClick={handleManualWhatsApp}
             title="Send WhatsApp Alert"
             className="p-2 bg-good/10 text-good hover:bg-good/20 border border-good/20 transition-colors"
           >
             <MessageSquare className="w-3.5 h-3.5" />
           </button>
           <button
             onClick={onToggleStatus}
             title={task.status === 'Completed' ? "Mark as Pending" : "Mark as Completed"}
             className={cn(
               "p-2 transition-colors border border-[var(--border-primary)]",
               task.status === 'Completed' ? "border-good/20 text-good bg-good/5" : "bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-good hover:bg-good/5"
             )}
           >
             <CheckCircle2 className="w-3.5 h-3.5" />
           </button>
           {task.linkedDocId && (
             <button
               onClick={onViewDoc}
               title="View Linked Document"
               className="p-2 bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 transition-colors"
             >
               <ExternalLink className="w-3.5 h-3.5" />
             </button>
           )}
           <button onClick={onEdit} className="p-2 bg-[var(--bg-page)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)] border border-[var(--border-primary)] transition-colors">
             <Pencil className="w-3.5 h-3.5" />
           </button>
           <button onClick={onDelete} className="p-2 bg-bad/10 text-bad hover:bg-bad/20 border border-bad/20 transition-colors">
             <Trash2 className="w-3.5 h-3.5" />
           </button>
         </div>
      </div>
    </motion.div>
  );
}

export default TaskManager;
