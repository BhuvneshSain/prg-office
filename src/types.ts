export interface AttachmentsData {
  id: string; // The generated unique ID for the file in Dropbox
  name: string; // Original filename
  link?: string; // Optional temporary download link fetched from dbx
}

export interface RegisterEntry {
  id: string; // Unique ID (e.g. timestamp or UUID)
  type: 'inward' | 'outward' | 'orders';
  date: string; // YYYY-MM-DD format
  partyName: string; // Sender, Recipient, or Assigned To
  subject: string; // Subject or Title
  referenceNumber: string; // Ref No. or Order ID
  remarks: string; // Remarks or Status info
  project?: string; // New explicitly uncoupled Project field
  attachments: AttachmentsData[]; // Array of attached files metadata
}

export interface SettingsData {
  departments: string[];
  projects: string[];
}
