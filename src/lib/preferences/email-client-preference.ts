/**
 * Helpers for persisting a user's preferred Email client selection.
 * Currently backed by localStorage so we can remember the selection across visits
 * without introducing server calls.
 */

const EMAIL_CLIENT_PREFERENCE_KEY = 'preferredEmailClientId';

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

export function getDefaultEmailClientId(): string | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  return storage.getItem(EMAIL_CLIENT_PREFERENCE_KEY);
}

export function setDefaultEmailClientId(clientId: string) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(EMAIL_CLIENT_PREFERENCE_KEY, clientId);
}

export function clearDefaultEmailClientId() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(EMAIL_CLIENT_PREFERENCE_KEY);
}
