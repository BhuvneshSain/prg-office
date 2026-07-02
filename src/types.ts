export interface AttachmentsData {
  id: string; // The generated unique ID for the file in Dropbox
  name: string; // Original filename
  link?: string; // Optional temporary download link fetched from dbx
}

export type RegisterType = 'inward' | 'outward' | 'orders' | 'staff' | 'tasks';

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Deferred';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type RecurrenceInterval = 'daily' | 'weekly' | 'monthly' | 'none';

export interface TaskEntry {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
  assignedTo: string[]; // Names of staff members
  linkedDocId?: string; // Reference to inward/order id
  linkedDocType?: 'inward' | 'orders';
  isRecurring?: boolean;
  recurrenceInterval?: RecurrenceInterval;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterEntry {
  id: string; // Unique ID (e.g. timestamp or UUID)
  type: RegisterType;
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
  whatsappApiKey?: string;
  whatsappRecipientPhone?: string;
}

export type AuditAction = 'ADD' | 'UPDATE' | 'DELETE' | 'TASK_LINK';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  type: RegisterType;
  targetId: string;
  details: string;
  user: string;
}
