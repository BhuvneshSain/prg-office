/**
 * Service for managing Register and settings data (JSON) in Dropbox
 */
import { dbx, checkConfig, handleDbxError } from './serviceUtils';
import type { RegisterEntry, SettingsData, AuditEntry, AuditAction } from '../types';

export type RegisterType = 'inward' | 'outward' | 'orders' | 'staff' | 'essential-docs';

const sortEntriesByDate = (entries: RegisterEntry[]) => {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
};

export const getRegisterData = async (type: RegisterType): Promise<RegisterEntry[]> => {
  if (!checkConfig()) return [];
  const path = `/data/${type}.json`;
  
  try {
    const response = await dbx.filesDownload({ path });
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    const data = JSON.parse(text) as RegisterEntry[];
    return type === 'staff' ? data : sortEntriesByDate(data);
  } catch (error) {
    const handled = handleDbxError(error, `getRegisterData(${type})`);
    return handled === null ? [] : [];
  }
};

export const saveRegisterData = async (type: RegisterType, data: RegisterEntry[]): Promise<boolean> => {
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
    await logAction('ADD', entry.type, entry.id, `Created ${entry.type} record: ${entry.subject || entry.referenceNumber}`);
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
    await logAction('UPDATE', entry.type, entry.id, `Modified ${entry.type} record: ${entry.subject || entry.referenceNumber}`);
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
    await logAction('DELETE', type, id, `Archived ${type} record: ${targetEntry.subject || targetEntry.referenceNumber}`);
  }
  return success;
};

export const getSettings = async (): Promise<SettingsData> => {
  if (!checkConfig()) return { departments: [], projects: [], posts: [] };
  try {
    const response = await dbx.filesDownload({ path: '/data/settings.json' });
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    return JSON.parse(text) as SettingsData;
  } catch (error) {
    const handled = handleDbxError(error, 'getSettings');
    return handled === null ? { departments: [], projects: [], posts: [] } : { departments: [], projects: [], posts: [] };
  }
};

export const saveSettings = async (settings: SettingsData): Promise<boolean> => {
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

export const getAuditLogs = async (): Promise<AuditEntry[]> => {
  if (!checkConfig()) return [];
  const path = '/data/audit-logs.json';
  try {
    const response = await dbx.filesDownload({ path });
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    return JSON.parse(text) as AuditEntry[];
  } catch (error) {
    handleDbxError(error, 'getAuditLogs');
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
    user: 'Cyber Admin' // Multi-user support can be added later
  };
  
  logs.unshift(entry);
  const content = JSON.stringify(logs.slice(0, 1000), null, 2); // Keep last 1000 logs
  
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
