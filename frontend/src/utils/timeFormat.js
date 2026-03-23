export const formatSingleTimeLabel = (value, fallback = '') => {
  const text = String(value || '').trim();
  if (!text) return fallback;

  const meridiemMatch = text.match(/\b(am|pm)\b/i);
  if (meridiemMatch) {
    return text.replace(/\b(am|pm)\b/gi, (token) => token.toUpperCase());
  }

  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return text;

  const hours24 = Number(match[1]);
  const minutes = match[2];
  if (!Number.isFinite(hours24)) return text;

  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${meridiem}`;
};

export const formatTimeRangeLabel = (value, fallback = '') => {
  const text = String(value || '').trim();
  if (!text) return fallback;

  if (!text.includes('-')) {
    return formatSingleTimeLabel(text, fallback);
  }

  const parts = text.split('-').map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return fallback;

  return parts.map((part) => formatSingleTimeLabel(part, part)).join(' - ');
};
