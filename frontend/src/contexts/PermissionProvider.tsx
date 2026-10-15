import { PermissionContext, PermissionContextValue, usePermissionContext } from './permission-context';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Permission, ApiError } from '@/api/types';
import { getPermissions } from '@/api/permissions';
import { useOrganization } from './OrganizationContext';
import { useAuth } from './AuthContext';
import { isApiError } from '@/api/client';

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { currentOrg } = useOrganization();
  const { isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Track active request to prevent duplicate concurrent requests
  const activeRequestIdRef = useRef<string | null>(null);
  const lastOrgIdRef = useRef<string | null>(null);

  const loadPermissions = useCallback(async (orgId: string) => {
    // Prevent duplicate concurrent requests for the same org
    if (activeRequestIdRef.current === orgId) return;
    activeRequestIdRef.current = orgId;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getPermissions(orgId);
      // Ensure we only apply if org hasn't changed while request was in-flight
      if (activeRequestIdRef.current === orgId) {
        setPermissions(response.permissions);
        setError(null);
      }
    } catch (err) {
      if (activeRequestIdRef.current === orgId) {
        setPermissions([]); // Fail-safe: do not invent permissions on error
        if (isApiError(err)) {
          setError(err);
        } else {
          setError({
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'Không thể tải danh sách quyền hạn. Vui lòng kiểm tra kết nối.',
              requestId: '',
            },
          });
        }
      }
    } finally {
      if (activeRequestIdRef.current === orgId) {
        activeRequestIdRef.current = null;
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // Invalidate immediately on logout or when no org is selected
    if (!isAuthenticated || !currentOrg) {
      setPermissions([]);
      setError(null);
      setIsLoading(false);
      activeRequestIdRef.current = null;
      lastOrgIdRef.current = null;
      return;
    }

    const orgId = currentOrg.id;
    // Invalidate permissions immediately when organization switches to prevent leakage
    if (lastOrgIdRef.current !== orgId) {
      setPermissions([]);
      setError(null);
      lastOrgIdRef.current = orgId;
    }

    loadPermissions(orgId);
  }, [isAuthenticated, currentOrg, loadPermissions]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (...perms: Permission[]): boolean => {
      return perms.some((p) => permissions.includes(p));
    },
    [permissions]
  );

  const refreshPermissions = useCallback(async () => {
    if (currentOrg) {
      await loadPermissions(currentOrg.id);
    }
  }, [currentOrg, loadPermissions]);

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        hasPermission,
        hasAnyPermission,
        isLoading,
        error,
        refreshPermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
}
