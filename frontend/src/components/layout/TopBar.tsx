import { Link } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { UserMenu } from './UserMenu';
import { GlobalSearch } from '@/features/search/GlobalSearch';
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher';

interface TopBarProps {
  onMenuClick: () => void;
  unreadCount: number;
}

export function TopBar({ onMenuClick, unreadCount }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center px-4 gap-4">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        aria-label="Mở menu điều hướng"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1 flex items-center gap-4">
        <OrganizationSwitcher />
      </div>

      <div className="flex items-center gap-2">
        <GlobalSearch />
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          aria-label={`Thông báo${unreadCount > 0 ? `, ${unreadCount} chưa đọc` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-[1rem] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-medium px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        <ThemeSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
