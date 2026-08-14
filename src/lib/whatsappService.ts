



/**
 * Generates a direct wa.me link for manual client-initiated messages
 */
export const getWhatsAppLink = (phone: string, text: string): string => {
  const cleanPhone = phone.replace(/[+\s-]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
};
