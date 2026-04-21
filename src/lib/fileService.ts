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
    const result = meta.result as { path_lower?: string; path_display?: string };
    const targetPath = result.path_lower || result.path_display || fullPath.toLowerCase();

    try {
      const listResponse = await dbx.sharingListSharedLinks({ path: targetPath, direct_only: true });
      if (listResponse.result.links.length > 0) return listResponse.result.links[0].url;
    } catch (listError) {
      console.warn("[Dropbox] Pre-check list failed:", listError);
    }

    try {
      const createResponse = await dbx.sharingCreateSharedLinkWithSettings({ path: targetPath });
      return createResponse.result.url;
    } catch (createError) {
      const dbxCreateError = createError as { status?: number; error?: { error_summary?: string } | string };
      const status = dbxCreateError?.status;
      const summary = typeof dbxCreateError?.error === 'string' ? dbxCreateError.error : dbxCreateError?.error?.error_summary || "";

      if (status === 409 || summary.includes('shared_link_already_exists')) {
        const allLinksResponse = await dbx.sharingListSharedLinks({});
        const match = allLinksResponse.result.links.find(l => {
          const lAny = l as { path_lower?: string; path_display?: string };
          return lAny.path_lower === targetPath || lAny.path_display === targetPath;
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
