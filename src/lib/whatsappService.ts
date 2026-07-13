import type { TaskEntry, RegisterEntry, SettingsData } from '../types';
import { formatDate } from '../utils/dateUtils';

/**
 * Sends a WhatsApp alert in the background via go-wppserver API gateway
 */
export const sendWppServerAlert = async (
  phone: string,
  text: string,
  serverUrl: string,
  token: string
): Promise<boolean> => {
  if (!serverUrl || !phone) return false;

  // Clean phone number (remove +, spaces, leading zeros, dashes)
  const cleanPhone = phone.replace(/[+\s-]/g, '');
  
  // Trim trailing slashes from serverUrl
  const baseUrl = serverUrl.replace(/\/+$/, '');
  const url = `${baseUrl}/v1/chat/send/text`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        phone: cleanPhone,
        body: text
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WhatsApp Service] Server responded with error status ${response.status}:`, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[WhatsApp Service] go-wppserver dispatch failed:", error);
    return false;
  }
};

/**
 * Generates a direct wa.me link for manual client-initiated messages
 */
export const getWhatsAppLink = (phone: string, text: string): string => {
  const cleanPhone = phone.replace(/[+\s-]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};

/**
 * Automates formatting and triggering alerts for a task assignment
 */
export const triggerTaskWhatsAppAlerts = async (
  task: TaskEntry,
  allStaff: RegisterEntry[],
  settings: SettingsData
): Promise<void> => {
  const serverUrl = settings.whatsappServerUrl || 'http://localhost:8786';
  const apiKey = settings.whatsappApiKey;

  if (!apiKey) {
    console.log("[WhatsApp Service] Background alert skipped: no WhatsApp API Key/Token configured.");
    return;
  }

  // Find mobile numbers for assigned staff
  const assignedMobiles = task.assignedTo
    .map(name => allStaff.find(s => s.partyName === name))
    .filter(staff => !!staff && !!staff.mobile)
    .map(staff => staff!.mobile!);

  // If no specific staff mobile is found, fall back to the settings recipient phone
  const targetPhones = assignedMobiles.length > 0 
    ? assignedMobiles 
    : (settings.whatsappRecipientPhone ? [settings.whatsappRecipientPhone] : []);

  if (targetPhones.length === 0) {
    console.log("[WhatsApp Service] Background alert skipped: no recipient phone number found.");
    return;
  }

  const messageText = `⚠️ *ProgOffice Task Assignment*
*Directive:* ${task.title}
*Priority:* ${task.priority}
*Due Date:* ${task.dueDate ? formatDate(task.dueDate) : 'No specific deadline'}
*Assigned To:* ${task.assignedTo.join(', ')}
_Description: ${task.description || 'No description provided.'}_`;

  console.log(`[WhatsApp Service] Triggering alerts to ${targetPhones.length} phone(s)...`);
  for (const phone of targetPhones) {
    await sendWppServerAlert(phone, messageText, serverUrl, apiKey);
  }
};
