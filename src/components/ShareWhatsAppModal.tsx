import { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RegisterEntry, SettingsData } from '../types';
import { formatDate } from '../utils/dateUtils';

interface ShareWhatsAppModalProps {
  entry: RegisterEntry;
  type: 'inward' | 'outward' | 'orders';
  staffData: RegisterEntry[];
  settings?: SettingsData;
  onClose: () => void;
}

export default function ShareWhatsAppModal({ entry, type, staffData, settings, onClose }: ShareWhatsAppModalProps) {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [customPhone, setCustomPhone] = useState(settings?.whatsappRecipientPhone || '');
  
  const getInitialMessage = () => {
    const formattedDate = formatDate(entry.date);
    if (type === 'inward') {
      return `📬 *ProgOffice Inward Register Alert*
*Ref No:* ${entry.referenceNumber || '—'}
*Sender/Party:* ${entry.partyName.replace(/\|\|\|/g, ', ')}
*Date:* ${formattedDate}
*Subject:* ${entry.subject}
${entry.remarks ? `*Remarks:* ${entry.remarks}` : ''}`;
    } else if (type === 'outward') {
      return `📤 *ProgOffice Outward Register Alert*
*Ref No:* ${entry.referenceNumber || '—'}
*Recipient/Party:* ${entry.partyName.replace(/\|\|\|/g, ', ')}
*Date:* ${formattedDate}
*Subject:* ${entry.subject}
${entry.remarks ? `*Remarks:* ${entry.remarks}` : ''}`;
    } else {
      return `📋 *ProgOffice Important Order Alert*
*RajKaj Ref:* ${entry.remarks || '—'}
*Project:* ${entry.project || 'Global'}
*Date:* ${formattedDate}
*Subject:* ${entry.subject}`;
    }
  };

  const [message, setMessage] = useState(getInitialMessage());

  const handleStaffChange = (staffName: string) => {
    setSelectedStaff(staffName);
    const staff = staffData.find(s => s.partyName === staffName);
    if (staff && staff.mobile) {
      setCustomPhone(staff.mobile);
    }
  };

  const handleSend = () => {
    if (!customPhone) {
      alert("Please enter or select a recipient phone number.");
      return;
    }
    const cleanPhone = customPhone.replace(/[+\s-]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/20 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative z-10 bg-paper border border-rule p-6 w-full max-w-lg shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center border-b border-rule pb-3">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-good" />
            <div>
              <h3 className="text-lg font-serif-display italic leading-none">Share via WhatsApp</h3>
              <p className="font-mono text-[9px] text-muted tracking-[0.16em] uppercase mt-1">Manual Alert Dispatcher</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Staff selection */}
          {staffData.length > 0 && (
            <div>
              <label className="block font-mono text-[10px] text-muted tracking-wider uppercase mb-1.5">Select Recipient Staff</label>
              <select
                value={selectedStaff}
                onChange={e => handleStaffChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-rule bg-[var(--input-bg)] text-ink font-serif-body text-sm outline-none focus:border-ink transition-colors"
              >
                <option value="">-- Choose Staff Member --</option>
                {staffData.filter(s => !!s.mobile).map(s => (
                  <option key={s.id} value={s.partyName}>{s.partyName} ({s.subject || 'Staff'}) - {s.mobile}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Phone */}
          <div>
            <label className="block font-mono text-[10px] text-muted tracking-wider uppercase mb-1.5">Recipient Phone Number</label>
            <input
              type="text"
              placeholder="+919988776655"
              value={customPhone}
              onChange={e => setCustomPhone(e.target.value)}
              className="w-full px-3 py-2.5 border border-rule bg-[var(--input-bg)] text-ink font-mono text-sm outline-none focus:border-ink transition-colors"
            />
          </div>

          {/* Message Preview */}
          <div>
            <label className="block font-mono text-[10px] text-muted tracking-wider uppercase mb-1.5">Message Content</label>
            <textarea
              rows={6}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full px-3 py-2.5 border border-rule bg-[var(--input-bg)] text-ink font-serif-body text-xs outline-none focus:border-ink transition-colors resize-none leading-relaxed"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t border-rule pt-4">
          <button onClick={onClose} className="flex-1 py-2.5 border border-rule text-muted font-serif-body text-sm hover:bg-panel transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="flex-1 py-2.5 bg-good text-paper font-serif-body text-sm hover:bg-good/90 transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" /> Open in WhatsApp
          </button>
        </div>
      </motion.div>
    </div>
  );
}
