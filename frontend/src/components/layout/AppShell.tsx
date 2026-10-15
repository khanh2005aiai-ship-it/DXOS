import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useOrganization } from '@/contexts/OrganizationContext';
import { listNotifications } from '@/api/notifications';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentOrg } = useOrganization();

  // Load unread notification count
  useEffect(() => {
    if (!currentOrg) {
      setUnreadCount(0);
      return;
    }
    let isCancelled = false;
    const orgId = currentOrg.id;

    const loadUnread = async () => {
      try {
        const response = await listNotifications(orgId, { state: 'unread', limit: 1 });
        if (!isCancelled) {
          setUnreadCount(response.items.length + (response.nextCursor ? 1 : 0));
        }
      } catch {
        // Silently fail - notification count is not critical
      }
    };
    loadUnread();
    const interval = setInterval(loadUnread, 60000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [currentOrg]);

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-slate-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} unreadCount={unreadCount} />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
