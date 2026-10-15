import { createContext, useContext } from 'react';
import type { Organization, ApiError } from '@/api/types';

export interface OrganizationContextValue {
  currentOrg: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  error?: ApiError | null;
  setCurrentOrg: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
}

export const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function useOrganization(): OrganizationContextValue {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
}

