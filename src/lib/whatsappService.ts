

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
