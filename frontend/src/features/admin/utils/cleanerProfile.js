const CLEANER_PLACEHOLDERS = new Set([
  'cleaner',
  'cleaner pending',
  'cleaner user',
  'unassigned'
]);

const normalizeText = (value, { allowUnassigned = false } = {}) => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (!allowUnassigned && CLEANER_PLACEHOLDERS.has(text.toLowerCase())) {
    return '';
  }
  return text;
};

const joinName = (...parts) => (
  parts
    .map((part) => normalizeText(part, { allowUnassigned: true }))
    .filter(Boolean)
    .join(' ')
    .trim()
);

const pickFirstText = (...candidates) => {
  for (const candidate of candidates) {
    const text = normalizeText(candidate);
    if (text) return text;
  }
  return '';
};

export const getCleanerDisplayName = (source = {}, fallback) => {
  const record = source && typeof source === 'object' ? source : { cleaner_name: source };
  const cleanerRecord = record?.cleaner && typeof record.cleaner === 'object' ? record.cleaner : {};
  const cleanerId =
    record?.cleaner_id
    ?? cleanerRecord?.cleaner_id
    ?? cleanerRecord?.id
    ?? null;
  const resolvedFallback = fallback || (cleanerId ? 'Cleaner' : 'Unassigned');

  return pickFirstText(
    record?.cleaner_display_name,
    record?.cleaner_full_name,
    joinName(record?.cleaner_first_name, record?.cleaner_last_name),
    cleanerRecord?.display_name,
    cleanerRecord?.full_name,
    cleanerRecord?.name,
    joinName(cleanerRecord?.first_name, cleanerRecord?.last_name),
    record?.name,
    record?.full_name,
    joinName(record?.first_name, record?.last_name),
    record?.company_name,
    record?.companyName,
    record?.cleaner_company,
    record?.cleaner_name,
    record?.cleaner_username,
    cleanerRecord?.username,
    record?.username,
    resolvedFallback
  );
};
