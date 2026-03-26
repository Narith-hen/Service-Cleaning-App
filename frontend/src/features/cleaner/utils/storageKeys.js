const getStoredCleanerIdentity = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    const userId = stored?.id || stored?.user_id || '';
    const accountSource = stored?.account_source || stored?.role || 'cleaner';
    return `${accountSource}:${userId || 'anonymous'}`;
  } catch {
    return 'cleaner:anonymous';
  }
};

export const getCleanerScopedStorageKey = (baseKey) => `${baseKey}:${getStoredCleanerIdentity()}`;
