/**
 * Helpers for persisting a user's preferred Direct Mail account selection.
 * Backed by localStorage so selections survive page reloads.
 */

const DIRECT_MAIL_ACCOUNT_KEY = 'preferredDirectMailAccountId';

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export function getDefaultDirectMailAccountId(): string | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  return storage.getItem(DIRECT_MAIL_ACCOUNT_KEY);
}

export function setDefaultDirectMailAccountId(accountId: string) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(DIRECT_MAIL_ACCOUNT_KEY, accountId);
}

export function clearDefaultDirectMailAccountId() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(DIRECT_MAIL_ACCOUNT_KEY);
}
