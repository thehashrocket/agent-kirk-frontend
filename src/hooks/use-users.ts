/**
 * @file src/hooks/use-users.ts
 * Custom hook for fetching and managing user and role data.
 * Uses SWR for data fetching, caching, and revalidation.
 */

import useSWR from 'swr';

/**
 * Role information interface.
 * @property {string} id - Unique identifier for the role
 * @property {string} name - Name of the role (e.g., "ADMIN", "CLIENT")
 */
interface Role {
  id: string;
  name: string;
}

/**
 * User information interface.
 * @property {string} id - Unique identifier for the user
 * @property {string | null} name - User's display name
 * @property {string | null} email - User's email address
 * @property {Role} role - User's assigned role
 * @property {boolean} isActive - User's active status
 * @property {string | null} accountRepId - Associated account representative ID
 * @property {object} gaAccounts - Google Analytics accounts associated with the user
 * @property {string} gaAccounts.id - Unique identifier for the Google Analytics account
 * @property {string} gaAccounts.gaAccountId - Google Analytics account ID
 * @property {string} gaAccounts.gaAccountName - Google Analytics account name
 * @property {object[]} gaAccounts.gaProperties - Google Analytics properties associated with the account
 * @property {string} gaAccounts.gaProperties.id - Unique identifier for the Google Analytics property
 * @property {string} gaAccounts.gaProperties.gaPropertyId - Google Analytics property ID
 * @property {string} gaAccounts.gaProperties.gaPropertyName - Google Analytics property name
 */
interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  isActive: boolean;
  image: string | null;
  accountRepId: string | null;
  gaAccounts: {
    id: string;
    gaAccountId: string;
    gaAccountName: string;
    gaProperties: {
      id: string;
      gaPropertyId: string;
      gaPropertyName: string;
    }[];
  }[];
}

/**
 * Fetcher function for SWR to handle API requests.
 * @param {string} url - API endpoint URL
 * @returns {Promise<any>} JSON response from the API
 */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Custom hook for managing users and roles data.
 * Features:
 * - Concurrent fetching of users and roles
 * - Automatic caching and revalidation
 * - Loading and error states
 * - Data mutation capabilities
 * 
 * @returns {Object} Hook return object
 * @property {User[] | undefined} users - Array of user objects if available
 * @property {Role[] | undefined} roles - Array of role objects if available
 * @property {boolean} isLoading - Loading state for both users and roles
 * @property {boolean} isError - Error state if either fetch fails
 * @property {Function} mutate - Function to trigger data revalidation
 */
export function useUsers() {
  const { data: users, error: usersError, mutate } = useSWR<User[]>('/api/users', async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch users');
    }
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Expected array of users but got: ' + typeof data);
    }
    return data;
  });
  const { data: roles, error: rolesError } = useSWR<Role[]>('/api/roles', fetcher);

  return {
    users,
    roles,
    isLoading: !users && !usersError && !roles && !rolesError,
    isError: usersError || rolesError,
    mutate,
  };
} 