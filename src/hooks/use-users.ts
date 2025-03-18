import useSWR from 'swr';

interface Role {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  isActive: boolean;
  accountRepId: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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