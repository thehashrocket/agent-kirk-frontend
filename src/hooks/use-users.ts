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
 */
interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  isActive: boolean;
  accountRepId: string | null;
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
  const { data: users, error: usersError, mutate } = useSWR<User[]>('/api/users', fetcher);
  const { data: roles, error: rolesError } = useSWR<Role[]>('/api/roles', fetcher);

  return {
    users,
    roles,
    isLoading: !users && !usersError && !roles && !rolesError,
    isError: usersError || rolesError,
    mutate,
  };
} 