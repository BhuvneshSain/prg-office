/**
 * Service for managing file uploads and links in Dropbox
 */
import { dbx, checkConfig, handleDbxError } from './serviceUtils';

export const uploadAttachment = async (file: File): Promise<{ id: string, name: string } | null> => {
  if (!checkConfig()) return null;
  
  const uniqueId = Date.now().toString() + '_' + Math.random().toString(36).substring(7);
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `/attachments/${uniqueId}_${safeName}`;
  
  try {
    const response = await dbx.filesUpload({
      path,
      contents: file,
      mode: { '.tag': 'add' }
    });
    return {
      id: response.result.path_display || response.result.name,
      name: file.name
    };
  } catch (error) {
    handleDbxError(error, `uploadAttachment(${file.name})`);
    return null;
  }
};

export const batchUploadAttachments = async (
  files: File[], 
  onProgress?: (processed: number, total: number) => void
): Promise<{ id: string, name: string }[]> => {
  if (!checkConfig() || files.length === 0) return [];
  
  let processed = 0;
  const total = files.length;
  
  const uploadPromises = files.map(async (file) => {
    try {
      const result = await uploadAttachment(file);
      processed++;
      if (onProgress) onProgress(processed, total);
      return result;
    } catch (err) {
      console.error(`Batch upload failed for ${file.name}`, err);
      processed++; // Still increment to keep progress correct
      if (onProgress) onProgress(processed, total);
      return null;
    }
  });

  const results = await Promise.all(uploadPromises);
  return results.filter((r): r is { id: string, name: string } => r !== null);
};

export const getFileLink = async (path: string): Promise<string | null> => {
  if (!checkConfig()) return null;
  const fullPath = (path.startsWith('/') || path.startsWith('id:')) ? path.trim() : `/attachments/${path.trim()}`;
  try {
    const response = await dbx.filesGetTemporaryLink({ path: fullPath });
    return response.result.link;
  } catch (error) {
    handleDbxError(error, `getFileLink(${path})`);
    return null;
  }
};

export const getSharedLink = async (path: string): Promise<string | null> => {
  if (!checkConfig()) return null;
  const fullPath = (path.startsWith('/') || path.startsWith('id:')) ? path.trim() : `/attachments/${path.trim()}`;
  
  try {
    // Strategy 1: Check if link already exists for this specific path
    try {
      const listResponse = await dbx.sharingListSharedLinks({ path: fullPath, direct_only: true });
      if (listResponse.result.links.length > 0) {
        return listResponse.result.links[0].url;
      }
    } catch (listError) {
      console.warn("[Dropbox] List for path failed, trying fallback...", listError);
    }

    // Strategy 2: Create new link
    try {
      const createResponse = await dbx.sharingCreateSharedLinkWithSettings({ 
        path: fullPath,
        settings: { requested_visibility: { '.tag': 'public' } }
      });
      return createResponse.result.url;
    } catch (createError: unknown) {
      const summary = (createError as { error?: { error_summary?: string } })?.error?.error_summary || "";
      if (summary.includes('shared_link_already_exists')) {
        // Last resort: list links for this path specifically
        const retryLinks = await dbx.sharingListSharedLinks({ path: fullPath });
        if (retryLinks.result.links.length > 0) {
          return retryLinks.result.links[0].url;
        }
        return null;
      }
      throw createError;
    }
  } catch (error) {
    handleDbxError(error, `getSharedLink(${path})`);
    return null;
  }
};

export const getFileBlob = async (path: string): Promise<Blob | null> => {
  if (!checkConfig()) return null;
  const fullPath = (path.startsWith('/') || path.startsWith('id:')) ? path.trim() : `/attachments/${path.trim()}`;
  try {
    const response = await dbx.filesDownload({ path: fullPath });
    return (response.result as unknown as { fileBlob: Blob }).fileBlob;
  } catch (error) {
    handleDbxError(error, `getFileBlob(${path})`);
    return null;
  }
};
