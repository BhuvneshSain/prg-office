/**
 * Formats a YYYY-MM-DD date string into DD/MM/YYYY representation for display
 */
export const formatDate = (dateStr: string | undefined | null): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};
