/**
 * Service for managing Register and settings data (JSON) in Dropbox
 */
import { dbx, checkConfig, handleDbxError, ensureValidToken } from './serviceUtils';
import type { RegisterEntry, SettingsData, AuditEntry, AuditAction, TaskEntry } from '../types';
import { getCachedData, setCachedData, setSyncNeeded, getAllUnsyncedKeys } from './indexedDb';

export type RegisterType = 'inward' | 'outward' | 'orders' | 'staff' | 'tasks';

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
  if (!checkConfig()) {
    const cached = await getCachedData<RegisterEntry[]>(type);
    return cached || [];
  }
  if (!force && cache[type]) {
    return cache[type] as RegisterEntry[];
  }
  const path = `/data/${type}.json`;
  
  try {
    await ensureValidToken();
    const response = await dbx.filesDownload({ path });
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    const data = JSON.parse(text) as RegisterEntry[];
    const sorted = type === 'staff' || type === 'tasks' ? data : sortEntriesByDate(data);
    
    // Persist to local IndexedDB cache
    await setCachedData(type, sorted);
    
    cache[type] = sorted;
    return sorted;
  } catch (error) {
    console.warn(`[Dropbox] getRegisterData(${type}) failed, loading from local cache...`);
    const cached = await getCachedData<RegisterEntry[]>(type);
    if (cached) {
      cache[type] = cached;
      return cached;
    }
    handleDbxError(error, `getRegisterData(${type})`);
    cache[type] = [];
    return [];
  }
};

export const saveRegisterData = async (type: RegisterType, data: RegisterEntry[]): Promise<boolean> => {
  cache[type] = data;
  await setCachedData(type, data); // cache locally first
  
  if (!checkConfig()) {
    await setSyncNeeded(type, true);
    return false;
  }
  const path = `/data/${type}.json`;
  const content = JSON.stringify(data, null, 2);
  
  try {
    await ensureValidToken();
    await dbx.filesUpload({
      path,
      contents: content,
      mode: { '.tag': 'overwrite' }
    });
    await setSyncNeeded(type, false);
    return true;
  } catch {
    console.warn(`[Dropbox] saveRegisterData(${type}) failed, queued for background sync.`);
    await setSyncNeeded(type, true);
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
  if (!checkConfig()) {
    const cached = await getCachedData<SettingsData>('settings');
    return cached || { departments: [], projects: [], posts: [] };
  }
  if (!force && cache.settings) {
    return cache.settings;
  }
  try {
    await ensureValidToken();
    const response = await dbx.filesDownload({ path: '/data/settings.json' });
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    const data = JSON.parse(text) as SettingsData;
    
    await setCachedData('settings', data);
    
    cache.settings = data;
    return data;
  } catch (error) {
    console.warn("[Dropbox] getSettings failed, loading local cache...");
    const cached = await getCachedData<SettingsData>('settings');
    if (cached) {
      cache.settings = cached;
      return cached;
    }
    handleDbxError(error, 'getSettings');
    const fallback = { departments: [], projects: [], posts: [] };
    cache.settings = fallback;
    return fallback;
  }
};

export const saveSettings = async (settings: SettingsData): Promise<boolean> => {
  cache.settings = settings;
  await setCachedData('settings', settings);
  
  if (!checkConfig()) {
    await setSyncNeeded('settings', true);
    return false;
  }
  const content = JSON.stringify(settings, null, 2);
  try {
    await ensureValidToken();
    await dbx.filesUpload({
      path: '/data/settings.json',
      contents: content,
      mode: { '.tag': 'overwrite' }
    });
    await setSyncNeeded('settings', false);
    return true;
  } catch {
    console.warn("[Dropbox] saveSettings failed, queued for background sync.");
    await setSyncNeeded('settings', true);
    return false;
  }
};

export const getAuditLogs = async (force = false): Promise<AuditEntry[]> => {
  if (!checkConfig()) {
    const cached = await getCachedData<AuditEntry[]>('audit-logs');
    return cached || [];
  }
  if (!force && cache['audit-logs']) {
    return cache['audit-logs'];
  }
  const path = '/data/audit-logs.json';
  try {
    await ensureValidToken();
    const response = await dbx.filesDownload({ path });
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    const data = JSON.parse(text) as AuditEntry[];
    
    await setCachedData('audit-logs', data);
    
    cache['audit-logs'] = data;
    return data;
  } catch (error) {
    console.warn("[Dropbox] getAuditLogs failed, loading local cache...");
    const cached = await getCachedData<AuditEntry[]>('audit-logs');
    if (cached) {
      cache['audit-logs'] = cached;
      return cached;
    }
    handleDbxError(error, 'getAuditLogs');
    cache['audit-logs'] = [];
    return [];
  }
};

export const logAction = async (action: AuditAction, type: RegisterType, targetId: string, details: string): Promise<boolean> => {
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
  await setCachedData('audit-logs', updatedLogs);
  
  if (!checkConfig()) {
    await setSyncNeeded('audit-logs', true);
    return false;
  }
  const content = JSON.stringify(updatedLogs, null, 2);
  
  try {
    await ensureValidToken();
    await dbx.filesUpload({
      path: '/data/audit-logs.json',
      contents: content,
      mode: { '.tag': 'overwrite' }
    });
    await setSyncNeeded('audit-logs', false);
    return true;
  } catch {
    console.warn("[Dropbox] logAction failed, queued for background sync.");
    await setSyncNeeded('audit-logs', true);
    return false;
  }
};

// Task specific methods
export const getTasks = async (force = false): Promise<TaskEntry[]> => {
  if (!checkConfig()) {
    const cached = await getCachedData<TaskEntry[]>('tasks');
    return cached || [];
  }
  if (!force && cache.tasks) {
    return cache.tasks;
  }
  const path = '/data/tasks.json';
  try {
    await ensureValidToken();
    const response = await dbx.filesDownload({ path });
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    const data = JSON.parse(text) as TaskEntry[];
    const sorted = data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    await setCachedData('tasks', sorted);
    
    cache.tasks = sorted;
    return sorted;
  } catch (error) {
    console.warn("[Dropbox] getTasks failed, loading local cache...");
    const cached = await getCachedData<TaskEntry[]>('tasks');
    if (cached) {
      cache.tasks = cached;
      return cached;
    }
    handleDbxError(error, 'getTasks');
    cache.tasks = [];
    return [];
  }
};

export const saveTasks = async (tasks: TaskEntry[]): Promise<boolean> => {
  cache.tasks = tasks;
  await setCachedData('tasks', tasks);
  
  if (!checkConfig()) {
    await setSyncNeeded('tasks', true);
    return false;
  }
  const content = JSON.stringify(tasks, null, 2);
  try {
    await ensureValidToken();
    await dbx.filesUpload({
      path: '/data/tasks.json',
      contents: content,
      mode: { '.tag': 'overwrite' }
    });
    await setSyncNeeded('tasks', false);
    return true;
  } catch {
    console.warn("[Dropbox] saveTasks failed, queued for background sync.");
    await setSyncNeeded('tasks', true);
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

// Sync Offline local databases back to Dropbox
export const syncOfflineData = async (): Promise<boolean> => {
  if (!checkConfig()) return false;
  const dirtyKeys = await getAllUnsyncedKeys();
  if (dirtyKeys.length === 0) return true;
  
  console.log(`[Sync] Found ${dirtyKeys.length} dirty registers. Syncing...`, dirtyKeys);
  let allSuccess = true;
  
  for (const key of dirtyKeys) {
    try {
      if (key === 'settings') {
        const data = await getCachedData<SettingsData>(key);
        if (data) {
          const content = JSON.stringify(data, null, 2);
          await ensureValidToken();
          await dbx.filesUpload({ path: '/data/settings.json', contents: content, mode: { '.tag': 'overwrite' } });
          await setSyncNeeded(key, false);
        }
      } else if (key === 'tasks') {
        const data = await getCachedData<TaskEntry[]>(key);
        if (data) {
          const content = JSON.stringify(data, null, 2);
          await ensureValidToken();
          await dbx.filesUpload({ path: '/data/tasks.json', contents: content, mode: { '.tag': 'overwrite' } });
          await setSyncNeeded(key, false);
        }
      } else if (key === 'audit-logs') {
        const data = await getCachedData<AuditEntry[]>(key);
        if (data) {
          const content = JSON.stringify(data, null, 2);
          await ensureValidToken();
          await dbx.filesUpload({ path: '/data/audit-logs.json', contents: content, mode: { '.tag': 'overwrite' } });
          await setSyncNeeded(key, false);
        }
      } else {
        // Register types (inward, outward, orders, staff)
        const data = await getCachedData<RegisterEntry[]>(key);
        if (data) {
          const content = JSON.stringify(data, null, 2);
          await ensureValidToken();
          await dbx.filesUpload({ path: `/data/${key}.json`, contents: content, mode: { '.tag': 'overwrite' } });
          await setSyncNeeded(key, false);
        }
      }
    } catch (err) {
      console.error(`[Sync] Sync failed for register: ${key}`, err);
      allSuccess = false;
    }
  }
  return allSuccess;
};
