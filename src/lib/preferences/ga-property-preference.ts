/**
 * Persistence helpers for storing the preferred Google Analytics property.
 * Currently uses localStorage so the dashboard can restore the user's choice
 * across sessions without extra API calls.
 */

const GA_PROPERTY_PREFERENCE_KEY = 'preferredGaPropertyId';

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

export function getDefaultGaPropertyId(): string | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  return storage.getItem(GA_PROPERTY_PREFERENCE_KEY);
}

export function setDefaultGaPropertyId(propertyId: string) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(GA_PROPERTY_PREFERENCE_KEY, propertyId);
}

export function clearDefaultGaPropertyId() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(GA_PROPERTY_PREFERENCE_KEY);
}
