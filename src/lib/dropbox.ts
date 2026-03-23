/**
 * Dropbox Sync Utility for JSON Data & File Attachments
 */
import { Dropbox } from 'dropbox';
import type { RegisterEntry, SettingsData } from '../types';

export type RegisterType = 'inward' | 'outward' | 'orders' | 'staff' | 'essential-docs';

const CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_DROPBOX_CLIENT_SECRET || '';
const REFRESH_TOKEN = import.meta.env.VITE_DROPBOX_REFRESH_TOKEN || '';

export const dbx = new Dropbox({ 
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  refreshToken: REFRESH_TOKEN
});

// Read data from JSON file in Dropbox
export const getRegisterData = async (type: RegisterType): Promise<RegisterEntry[]> => {
  if (!REFRESH_TOKEN) return [];
  const path = `/data/${type}.json`;
  
  try {
    const response = await dbx.filesDownload({ path });
    // Dropbox filesDownload result contains fileBlob in browser env
    const blob = (response.result as any).fileBlob as Blob;
    const text = await blob.text();
    return JSON.parse(text) as RegisterEntry[];
  } catch (error: any) {
    if (error?.status === 409 || error?.error?.error_summary?.includes('not_found')) {
      // File doesn't exist yet, return empty array
      return [];
    }
    if (error?.error?.error_summary?.includes('expired_access_token')) {
      throw new Error('Dropbox Access Token has expired. Please update it.');
    }
    console.error(`Error loading ${type} data from Dropbox`, error);
    return [];
  }
};

// Save fully appended array back to Dropbox
export const saveRegisterData = async (type: RegisterType, data: RegisterEntry[]): Promise<boolean> => {
  if (!REFRESH_TOKEN) return false;
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
    console.error(`Error saving ${type} data to Dropbox`, error);
    return false;
  }
};

// Add a single new entry
export const addRegisterEntry = async (entry: RegisterEntry): Promise<boolean> => {
  const existingData = await getRegisterData(entry.type);
  existingData.unshift(entry); // Add newest to the top
  return await saveRegisterData(entry.type, existingData);
};

// Update an existing entry by ID
export const updateRegisterEntry = async (entry: RegisterEntry): Promise<boolean> => {
  const existingData = await getRegisterData(entry.type);
  const idx = existingData.findIndex(e => e.id === entry.id);
  if (idx === -1) return false;
  existingData[idx] = entry;
  return await saveRegisterData(entry.type, existingData);
};

// Delete an entry by ID
export const deleteRegisterEntry = async (id: string, type: RegisterType): Promise<boolean> => {
  const existingData = await getRegisterData(type);
  const filtered = existingData.filter(e => e.id !== id);
  if (filtered.length === existingData.length) return false; // Not found
  return await saveRegisterData(type, filtered);
};

// Upload an attachment file
export const uploadAttachment = async (file: File): Promise<{ id: string, name: string } | null> => {
  if (!REFRESH_TOKEN) return null;
  
  const uniqueId = Date.now().toString() + '_' + Math.random().toString(36).substring(7);
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `/attachments/${uniqueId}_${safeName}`;
  
  try {
    const response = await dbx.filesUpload({
      path,
      contents: file,
      mode: { '.tag': 'add' } // Don't overwrite existing
    });
    return {
      id: response.result.name, // The full unique filename in dropbox
      name: file.name
    };
  } catch (error) {
    console.error("Error uploading attachment", error);
    return null;
  }
};

// Fetch temporary link for a file (for Download button)
export const getFileLink = async (filename: string): Promise<string | null> => {
  if (!REFRESH_TOKEN) return null;
  try {
    const response = await dbx.filesGetTemporaryLink({ path: `/attachments/${filename}` });
    return response.result.link;
  } catch (error) {
    console.error("Error fetching file link", error);
    return null;
  }
};

// Fetch actual file content as a Blob URL to bypass Dropbox's forced download headers
export const getFileBlobUrl = async (filename: string): Promise<string | null> => {
  if (!REFRESH_TOKEN) return null;
  try {
    const response = await dbx.filesDownload({ path: `/attachments/${filename}` });
    const blob = (response.result as any).fileBlob as Blob;
    
    // Explicitly enforce application/pdf to ensure browser rendering plugin kicks in
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    return URL.createObjectURL(pdfBlob);
  } catch (error) {
    console.error("Error fetching file blob", error);
    return null;
  }
};

// Fetch settings
export const getSettings = async (): Promise<SettingsData> => {
  if (!REFRESH_TOKEN) return { departments: ['Finance', 'HR', 'IT'], projects: ['Alpha', 'Beta'], posts: ['Manager', 'Developer'] };
  try {
    const response = await dbx.filesDownload({ path: '/data/settings.json' });
    const blob = (response.result as any).fileBlob as Blob;
    const text = await blob.text();
    return JSON.parse(text) as SettingsData;
  } catch (error: any) {
    if (error?.status === 409 || error?.error?.error_summary?.includes('not_found')) {
      return { departments: [], projects: [], posts: [] };
    }
    console.error("Error fetching settings", error);
    return { departments: [], projects: [], posts: [] };
  }
};

export const saveSettings = async (settings: SettingsData): Promise<boolean> => {
  if (!REFRESH_TOKEN) return true;
  const content = JSON.stringify(settings, null, 2);
  try {
    await dbx.filesUpload({
      path: '/data/settings.json',
      contents: content,
      mode: { '.tag': 'overwrite' }
    });
    return true;
  } catch (error) {
    console.error("Error saving settings", error);
    return false;
  }
};
