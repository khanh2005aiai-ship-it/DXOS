import { OrganizationContext, OrganizationContextValue, useOrganization } from './organization-context';
import React, { useState, useEffect, useCallback } from 'react';
import type { Organization, ApiError } from '@/api/types';
import { listOrganizations } from '@/api/organizations';
import { useAuth } from './AuthContext';
import { clearPermissionCache } from '@/hooks/usePermission';
import { isApiError } from '@/api/client';

const ORG_STORAGE_KEY = 'dx_current_org_id';

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const loadOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listOrganizations({ limit: 100 });
      setOrganizations(response.items);

      // Restore previously selected org or auto-select first
      const savedOrgId = localStorage.getItem(ORG_STORAGE_KEY);
      const savedOrg = response.items.find((o) => o.id === savedOrgId);
      if (savedOrg) {
        setCurrentOrgState(savedOrg);
      } else if (response.items.length > 0) {
        setCurrentOrgState(response.items[0]);
        localStorage.setItem(ORG_STORAGE_KEY, response.items[0].id);
      } else {
        setCurrentOrgState(null);
        localStorage.removeItem(ORG_STORAGE_KEY);
      }
    } catch (err) {
      if (isApiError(err)) {
        setError(err);
      } else {
        setError({
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Không thể tải danh sách tổ chức. Vui lòng kiểm tra kết nối.',
            requestId: '',
          },
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrgState(null);
      setError(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, loadOrganizations]);

  const setCurrentOrg = useCallback((org: Organization) => {
    clearPermissionCache();
    setCurrentOrgState(org);
    localStorage.setItem(ORG_STORAGE_KEY, org.id);
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        organizations,
        isLoading,
        error,
        setCurrentOrg,
        refreshOrganizations: loadOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}
