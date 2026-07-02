import type { TaskEntry, RegisterEntry, SettingsData } from '../types';
import { formatDate } from '../utils/dateUtils';

/**
 * Sends a WhatsApp alert in the background via CallMeBot gateway
 */
export const sendCallMeBotAlert = async (phone: string, text: string, apiKey: string): Promise<boolean> => {
  if (!apiKey || !phone) return false;
  // Clean phone number (remove +, spaces, leading zeros)
  const cleanPhone = phone.replace(/[+\s-]/g, '');
  const encodedText = encodeURIComponent(text);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedText}&apikey=${apiKey}`;

  try {
    await fetch(url, { mode: 'no-cors' });
    // Note: CallMeBot API sometimes returns a text response that doesn't permit CORS,
    // using mode 'no-cors' lets the request go through safely.
    return true;
  } catch (error) {
    console.error("[WhatsApp Service] CallMeBot dispatch failed:", error);
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
  const apiKey = settings.whatsappApiKey;
  if (!apiKey) {
    console.log("[WhatsApp Service] Background alert skipped: no CallMeBot API key configured.");
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
    await sendCallMeBotAlert(phone, messageText, apiKey);
  }
};
