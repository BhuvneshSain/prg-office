/**
 * Service for managing Register and settings data (JSON) in Dropbox
 */
import { dbx, checkConfig, handleDbxError } from './serviceUtils';
import type { RegisterEntry, SettingsData, AuditEntry, AuditAction, TaskEntry } from '../types';

export type RegisterType = 'inward' | 'outward' | 'orders' | 'staff' | 'essential-docs' | 'tasks';

// Client-side cache for JSON data files
const cache: Record<string, any> = {};

export const clearDataCache = () => {
  for (const key in cache) {
    delete cache[key];
  }
};

const sortEntriesByDate = (entries: RegisterEntry[]) => {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
};

export const getRegisterData = async (type: RegisterType, force = false): Promise<RegisterEntry[]> => {
  if (!checkConfig()) return [];
  if (!force && cache[type]) {
    return cache[type] as RegisterEntry[];
  }
  const path = `/data/${type}.json`;
  
  try {
    const response = await dbx.filesDownload({ path });
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    const data = JSON.parse(text) as RegisterEntry[];
    const sorted = type === 'staff' || type === 'tasks' ? data : sortEntriesByDate(data);
    cache[type] = sorted;
    return sorted;
  } catch (error) {
    handleDbxError(error, `getRegisterData(${type})`);
    cache[type] = [];
    return [];
  }
};

export const saveRegisterData = async (type: RegisterType, data: RegisterEntry[]): Promise<boolean> => {
  cache[type] = data;
  if (!checkConfig()) return false;
  const path = `/data/${type}.json`;
  const content = JSON.stringify(data, null, 2);
  
  try {
    await dbx.filesUpload({
      path,
      contents: content,
      mode: { '.tag': 'overwrite' }
    });
    return true;
  } catch (error) {
    handleDbxError(error, `saveRegisterData(${type})`);
    return false;
  }
};

export const addRegisterEntry = async (entry: RegisterEntry): Promise<boolean> => {
  const existingData = await getRegisterData(entry.type);
  existingData.unshift(entry);
  const finalData = entry.type === 'staff' ? existingData : sortEntriesByDate(existingData);
  const success = await saveRegisterData(entry.type, finalData);
  if (success) {
    logAction('ADD', entry.type, entry.id, `Created ${entry.type} record: ${entry.subject || entry.referenceNumber}`);
  }
  return success;
};

export const updateRegisterEntry = async (entry: RegisterEntry): Promise<boolean> => {
  const existingData = await getRegisterData(entry.type);
  const idx = existingData.findIndex(e => e.id === entry.id);
  if (idx === -1) return false;
  existingData[idx] = entry;
  const finalData = entry.type === 'staff' ? existingData : sortEntriesByDate(existingData);
  const success = await saveRegisterData(entry.type, finalData);
  if (success) {
    logAction('UPDATE', entry.type, entry.id, `Modified ${entry.type} record: ${entry.subject || entry.referenceNumber}`);
  }
  return success;
};

export const deleteRegisterEntry = async (id: string, type: RegisterType): Promise<boolean> => {
  const existingData = await getRegisterData(type);
  const targetEntry = existingData.find(e => e.id === id);
  const filtered = existingData.filter(e => e.id !== id);
  if (filtered.length === existingData.length) return false;
  const success = await saveRegisterData(type, filtered);
  if (success && targetEntry) {
    logAction('DELETE', type, id, `Archived ${type} record: ${targetEntry.subject || targetEntry.referenceNumber}`);
  }
  return success;
};

export const getSettings = async (force = false): Promise<SettingsData> => {
  if (!checkConfig()) return { departments: [], projects: [], posts: [] };
  if (!force && cache.settings) {
    return cache.settings;
  }
  try {
    const response = await dbx.filesDownload({ path: '/data/settings.json' });
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    const data = JSON.parse(text) as SettingsData;
    cache.settings = data;
    return data;
  } catch (error) {
    handleDbxError(error, 'getSettings');
    const fallback = { departments: [], projects: [], posts: [] };
    cache.settings = fallback;
    return fallback;
  }
};

export const saveSettings = async (settings: SettingsData): Promise<boolean> => {
  cache.settings = settings;
  if (!checkConfig()) return false;
  const content = JSON.stringify(settings, null, 2);
  try {
    await dbx.filesUpload({
      path: '/data/settings.json',
      contents: content,
      mode: { '.tag': 'overwrite' }
    });
    return true;
  } catch (error) {
    handleDbxError(error, 'saveSettings');
    return false;
  }
};

export const getAuditLogs = async (force = false): Promise<AuditEntry[]> => {
  if (!checkConfig()) return [];
  if (!force && cache['audit-logs']) {
    return cache['audit-logs'];
  }
  const path = '/data/audit-logs.json';
  try {
    const response = await dbx.filesDownload({ path });
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    const data = JSON.parse(text) as AuditEntry[];
    cache['audit-logs'] = data;
    return data;
  } catch (error) {
    handleDbxError(error, 'getAuditLogs');
    cache['audit-logs'] = [];
    return [];
  }
};

export const logAction = async (action: AuditAction, type: RegisterType, targetId: string, details: string): Promise<boolean> => {
  if (!checkConfig()) return false;
  const logs = await getAuditLogs();
  const entry: AuditEntry = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    action,
    type,
    targetId,
    details,
    user: 'Cyber Admin'
  };
  
  logs.unshift(entry);
  const updatedLogs = logs.slice(0, 1000);
  cache['audit-logs'] = updatedLogs;
  const content = JSON.stringify(updatedLogs, null, 2);
  
  try {
    await dbx.filesUpload({
      path: '/data/audit-logs.json',
      contents: content,
      mode: { '.tag': 'overwrite' }
    });
    return true;
  } catch (error) {
    handleDbxError(error, 'logAction');
    return false;
  }
};

// Task specific methods
export const getTasks = async (force = false): Promise<TaskEntry[]> => {
  if (!checkConfig()) return [];
  if (!force && cache.tasks) {
    return cache.tasks;
  }
  const path = '/data/tasks.json';
  try {
    const response = await dbx.filesDownload({ path });
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    const data = JSON.parse(text) as TaskEntry[];
    const sorted = data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    cache.tasks = sorted;
    return sorted;
  } catch (error) {
    handleDbxError(error, 'getTasks');
    cache.tasks = [];
    return [];
  }
};

export const saveTasks = async (tasks: TaskEntry[]): Promise<boolean> => {
  cache.tasks = tasks;
  if (!checkConfig()) return false;
  const content = JSON.stringify(tasks, null, 2);
  try {
    await dbx.filesUpload({
      path: '/data/tasks.json',
      contents: content,
      mode: { '.tag': 'overwrite' }
    });
    return true;
  } catch (error) {
    handleDbxError(error, 'saveTasks');
    return false;
  }
};

export const addTask = async (task: TaskEntry): Promise<boolean> => {
  const tasks = await getTasks();
  tasks.unshift(task);
  const success = await saveTasks(tasks);
  if (success) {
    logAction('ADD', 'tasks', task.id, `Created task: ${task.title}`);
  }
  return success;
};

export const updateTask = async (task: TaskEntry): Promise<boolean> => {
  const tasks = await getTasks();
  const idx = tasks.findIndex(t => t.id === task.id);
  if (idx === -1) return false;
  tasks[idx] = { ...task, updatedAt: new Date().toISOString() };
  const sortedTasks = tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const success = await saveTasks(sortedTasks);
  if (success) {
    logAction('UPDATE', 'tasks', task.id, `Updated task: ${task.title}`);
  }
  return success;
};

export const deleteTask = async (id: string): Promise<boolean> => {
  const tasks = await getTasks();
  const target = tasks.find(t => t.id === id);
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) return false;
  const success = await saveTasks(filtered);
  if (success && target) {
    logAction('DELETE', 'tasks', id, `Deleted task: ${target.title}`);
  }
  return success;
};
