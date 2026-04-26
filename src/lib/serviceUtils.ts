/**
 * Core Dropbox Shared Utility
 */
import { Dropbox } from 'dropbox';

const CLIENT_ID = import.meta.env.VITE_DROPBOX_CLIENT_ID || '';
const CLIENT_SECRET = import.meta.env.VITE_DROPBOX_CLIENT_SECRET || '';
const REFRESH_TOKEN = import.meta.env.VITE_DROPBOX_REFRESH_TOKEN || '';

export const dbx = new Dropbox({ 
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  refreshToken: REFRESH_TOKEN
});

export const checkConfig = () => {
  if (!REFRESH_TOKEN) {
    console.warn("Dropbox Refresh Token is missing from environment variables.");
    return false;
  }
  return true;
};

export const handleDbxError = (error: unknown, context: string) => {
  const dbxError = error as { status?: number; error?: { error_summary?: string } };
  const summary = dbxError?.error?.error_summary || "";
  
  if (dbxError?.status === 409 || summary.includes('not_found')) {
    return null; // Not found is sometimes expected
  }
  
  if (summary.includes('expired_access_token')) {
    throw new Error('Dropbox Access Token has expired. Please update it.');
  }
  
  console.error(`[Dropbox] Error in ${context}:`, {
    status: dbxError?.status,
    summary,
    details: dbxError?.error
  });
  return undefined;
};
