/**
 * Helpers for persisting a user's preferred Sprout Social account selection.
 * Uses localStorage to ensure the selection is restored between sessions.
 */

const SPROUT_SOCIAL_ACCOUNT_KEY = 'preferredSproutSocialAccountId';

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

export function getDefaultSproutSocialAccountId(): string | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  return storage.getItem(SPROUT_SOCIAL_ACCOUNT_KEY);
}

export function setDefaultSproutSocialAccountId(accountId: string) {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(SPROUT_SOCIAL_ACCOUNT_KEY, accountId);
}

export function clearDefaultSproutSocialAccountId() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(SPROUT_SOCIAL_ACCOUNT_KEY);
}
