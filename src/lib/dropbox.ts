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

// Helper to sort register entries by date descending (newest first)
const sortEntriesByDate = (entries: RegisterEntry[]) => {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
};

// Read data from JSON file in Dropbox
export const getRegisterData = async (type: RegisterType): Promise<RegisterEntry[]> => {
  if (!REFRESH_TOKEN) return [];
  const path = `/data/${type}.json`;
  
  try {
    const response = await dbx.filesDownload({ path });
    // Dropbox filesDownload result contains fileBlob in browser env
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    const data = JSON.parse(text) as RegisterEntry[];
    if (type === 'staff') return data; // Keep manual order for staff
    return sortEntriesByDate(data);
  } catch (error: unknown) {
    const dbxError = error as { status?: number; error?: { error_summary?: string } };
    if (dbxError?.status === 409 || dbxError?.error?.error_summary?.includes('not_found')) {
      // File doesn't exist yet, return empty array
      return [];
    }
    if (dbxError?.error?.error_summary?.includes('expired_access_token')) {
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
  existingData.unshift(entry); // Add to array
  
  // Sort if not staff to keep JSON file organized
  const finalData = entry.type === 'staff' ? existingData : sortEntriesByDate(existingData);
  return await saveRegisterData(entry.type, finalData);
};

// Update an existing entry by ID
export const updateRegisterEntry = async (entry: RegisterEntry): Promise<boolean> => {
  const existingData = await getRegisterData(entry.type);
  const idx = existingData.findIndex(e => e.id === entry.id);
  if (idx === -1) return false;
  existingData[idx] = entry;
  
  // Sort if not staff to handle date updates
  const finalData = entry.type === 'staff' ? existingData : sortEntriesByDate(existingData);
  return await saveRegisterData(entry.type, finalData);
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
      id: response.result.path_display || response.result.name, // Store the full path for reliability
      name: file.name
    };
  } catch (error: unknown) {
    console.error("Error uploading attachment", error);
    return null;
  }
};

// Fetch temporary link for a file (for Download button)
export const getFileLink = async (path: string): Promise<string | null> => {
  if (!REFRESH_TOKEN) return null;
  const fullPath = (path.startsWith('/') || path.startsWith('id:')) ? path.trim() : `/attachments/${path.trim()}`;
  try {
    const response = await dbx.filesGetTemporaryLink({ path: fullPath });
    return response.result.link;
  } catch (error) {
    console.error("Error fetching file link", error);
    return null;
  }
};

// Fetch PUBLIC shared link for remote viewing (Final Stability Fix)
export const getSharedLink = async (path: string): Promise<string | null> => {
  if (!REFRESH_TOKEN) return null;
  
  const fullPath = (path.startsWith('/') || path.startsWith('id:')) ? path.trim() : `/attachments/${path.trim()}`;
  
  try {
    const meta = await dbx.filesGetMetadata({ path: fullPath });
    const result = meta.result as { path_lower?: string; path_display?: string; name?: string };
    const targetPath = result.path_lower || result.path_display || fullPath.toLowerCase();

    // 2. CHECK FOR EXISTING LINKS FIRST (Faster & more reliable than immediate CREATE)
    try {
      const listResponse = await dbx.sharingListSharedLinks({ path: targetPath, direct_only: true });
      if (listResponse.result.links.length > 0) return listResponse.result.links[0].url;
    } catch (listError: unknown) {
      console.warn("[Dropbox] Pre-check list failed:", listError);
    }

    // 3. ATTEMPT TO CREATE (Requires sharing.write)
    try {
      const createResponse = await dbx.sharingCreateSharedLinkWithSettings({ path: targetPath });
      return createResponse.result.url;
    } catch (createError: unknown) {
      const dbxCreateError = createError as { status?: number; error?: { error_summary?: string } | string };
      const status = dbxCreateError?.status;
      
      // 4. Fallback if already exists (409 Conflict) - handles race conditions
      const summary = typeof dbxCreateError?.error === 'string' 
        ? dbxCreateError.error 
        : dbxCreateError?.error?.error_summary || "";

      if (status === 409 || summary.includes('shared_link_already_exists')) {
        const allLinksResponse = await dbx.sharingListSharedLinks({});
        const match = allLinksResponse.result.links.find(l => {
          const link = l as { path_lower?: string; path_display?: string };
          return link.path_lower === targetPath || link.path_display === targetPath;
        });
        if (match) return match.url;
      }
      
      // 5. CRITICAL: Don't use Temporary Links for regular embeds (CSP block)
      // Log for the UI to handle PDF-specific fallbacks
      console.warn(`[Dropbox] Sharing creation failed (Status: ${status}).`);
      throw createError;
    }
  } catch (error: unknown) {
    const dbxError = error as { error?: { error_summary?: string }; message?: string };
    const errorMsg = dbxError?.error?.error_summary || dbxError?.message || "Unknown error";
    console.error(`[Dropbox] Final sharing failure for "${fullPath}":`, errorMsg);
    return null;
  }
};

// Fetch settings
export const getSettings = async (): Promise<SettingsData> => {
  if (!REFRESH_TOKEN) return { departments: ['Finance', 'HR', 'IT'], projects: ['Alpha', 'Beta'], posts: ['Manager', 'Developer'] };
  try {
    const response = await dbx.filesDownload({ path: '/data/settings.json' });
    const result = response.result as unknown as { fileBlob: Blob };
    const text = await result.fileBlob.text();
    return JSON.parse(text) as SettingsData;
  } catch (error: unknown) {
    const dbxError = error as { status?: number; error?: { error_summary?: string } };
    if (dbxError?.status === 409 || dbxError?.error?.error_summary?.includes('not_found')) {
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
