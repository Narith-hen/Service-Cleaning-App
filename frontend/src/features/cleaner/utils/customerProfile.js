const CUSTOMER_PLACEHOLDERS = new Set([
  'customer',
  'a customer',
  'customer user'
]);

const normalizeText = (value, { allowPlaceholder = false } = {}) => {
  const text = String(value || '').trim();
  if (!text) return '';
  if (!allowPlaceholder && CUSTOMER_PLACEHOLDERS.has(text.toLowerCase())) {
    return '';
  }
  return text;
};

const joinName = (...parts) => (
  parts
    .map((part) => normalizeText(part, { allowPlaceholder: true }))
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

export const getCustomerDisplayName = (source = {}) => {
  const record = source && typeof source === 'object' ? source : { customer: source };
  const customerRecord = record?.customer && typeof record.customer === 'object' ? record.customer : {};
  const userRecord = record?.user && typeof record.user === 'object' ? record.user : {};

  return pickFirstText(
    record?.customer_display_name,
    record?.customer_full_name,
    record?.customer_name,
    record?.display_name,
    record?.full_name,
    joinName(record?.customer_first_name, record?.customer_last_name),
    customerRecord?.display_name,
    customerRecord?.name,
    customerRecord?.full_name,
    joinName(customerRecord?.first_name, customerRecord?.last_name),
    userRecord?.display_name,
    userRecord?.name,
    userRecord?.full_name,
    joinName(userRecord?.first_name, userRecord?.last_name),
    record?.user_name,
    record?.customer_username,
    customerRecord?.username,
    userRecord?.username,
    joinName(record?.first_name, record?.last_name),
    typeof record?.customer === 'string' ? record.customer : '',
    'Customer'
  );
};
