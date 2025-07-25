/**
 * Normalize platform and role names to their display-friendly versions
 * 
 * Social Account Names:
 * - facebook
 * - fb_instagram_account
 * - google_my_business
 * - linkedin_company
 * - linkedin
 * - twitter
 * - yelp
 * - youtube
 * - tiktok
 * - pinterest
 * 
 * User Roles:
 * - ACCOUNT_REP
 * - ADMIN
 * - CLIENT
 */

type NormalizableKey = 
  | 'facebook'
  | 'fb_instagram_account'
  | 'google_my_business'
  | 'linkedin_company'
  | 'linkedin'
  | 'twitter'
  | 'yelp'
  | 'youtube'
  | 'tiktok'
  | 'pinterest'
  | 'ACCOUNT_REP'
  | 'ADMIN'
  | 'CLIENT';

/**
 * Lookup table for efficient O(1) name normalization
 */
const NAME_MAPPINGS = new Map<NormalizableKey, string>([
  // Social platforms
  ['facebook', 'Facebook'],
  ['fb_instagram_account', 'Instagram'],
  ['google_my_business', 'Google My Business'],
  ['linkedin_company', 'LinkedIn'],
  ['linkedin', 'LinkedIn'],
  ['twitter', 'Twitter'],
  ['yelp', 'Yelp'],
  ['youtube', 'YouTube'],
  ['tiktok', 'TikTok'],
  ['pinterest', 'Pinterest'],
  
  // User roles
  ['ACCOUNT_REP', 'Account Manager'],
  ['ADMIN', 'Administrator'],
  ['CLIENT', 'Client'],
]);

/**
 * Normalizes platform and role names to their display-friendly versions.
 * Returns the original name if no mapping is found.
 * 
 * @param name - The name to normalize
 * @returns The normalized display name or original name if no match found
 */
export const normalizeNames = (name: string): string => {
  return NAME_MAPPINGS.get(name as NormalizableKey) ?? name;
}; 