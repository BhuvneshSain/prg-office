export interface AttachmentsData {
  id: string; // The generated unique ID for the file in Dropbox
  name: string; // Original filename
  link?: string; // Optional temporary download link fetched from dbx
}

export interface RegisterEntry {
  id: string; // Unique ID (e.g. timestamp or UUID)
  type: 'inward' | 'outward' | 'orders' | 'staff' | 'my-documents';
  date: string; // YYYY-MM-DD or Entry Date
  partyName: string; // Sender, Recipient, Assigned To, OR Staff Name
  subject: string; // Subject, Title, OR Post/Designation
  referenceNumber: string; // Ref No., Order ID, OR Employee ID/Code
  remarks: string; // Remarks, Status info
  project?: string; // Project name(s). For staff, this will be ||| separated multiple projects.
  mobile?: string; // Mobile number for staff
  attachments: AttachmentsData[]; // Array of attached files metadata
}

export interface SettingsData {
  departments: string[];
  projects: string[];
  posts: string[];
}
