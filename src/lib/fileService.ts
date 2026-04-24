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
    const meta = await dbx.filesGetMetadata({ path: fullPath });
    const fileId = (meta.result as any).id;
    const targetLower = (meta.result as { path_lower?: string }).path_lower || fullPath.toLowerCase();

    // Strategy 1: List all links without any path parameter to avoid 400 errors
    try {
      // Calling without any arguments to get the full list for the user/app
      const allLinksResponse = await dbx.sharingListSharedLinks({});
      const match = allLinksResponse.result.links.find(l => {
        const lAny = l as { path_lower?: string; id?: string };
        const lp = lAny.path_lower?.toLowerCase();
        return lAny.id === fileId || lp === targetLower || (lp && targetLower.endsWith(lp)) || (targetLower && lp && lp.endsWith(targetLower));
      });
      if (match) return match.url;
    } catch (listError) {
      console.warn("[Dropbox] Base list failed:", listError);
    }

    // Strategy 2: If no link exists, try to create one with the canonical path from metadata
    try {
      const canonicalPath = (meta.result as { path_display?: string }).path_display || fullPath;
      const createResponse = await dbx.sharingCreateSharedLinkWithSettings({ path: canonicalPath });
      return createResponse.result.url;
    } catch (createError: any) {
      const summary = createError?.error?.error_summary || "";
      if (summary.includes('shared_link_already_exists')) {
          const retryLinks = await dbx.sharingListSharedLinks({});
          const match = retryLinks.result.links.find(l => {
             const lAny = l as { path_lower?: string; id?: string };
             return lAny.id === fileId || lAny.path_lower?.toLowerCase() === targetLower;
          });
          if (match) return match.url;
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
    return (response.result as any).fileBlob;
  } catch (error) {
    handleDbxError(error, `getFileBlob(${path})`);
    return null;
  }
};
