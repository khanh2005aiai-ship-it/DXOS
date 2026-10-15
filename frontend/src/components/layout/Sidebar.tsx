import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Building2,
  Users,
  CheckSquare,
  CalendarDays,
  CalendarOff,
  Clock,
  ClipboardCheck,
  Bell,
  FolderOpen,
  Bot,
  Settings,
  X,
  Banknote,
  BarChart3,
  Award,
  FileCheck,
  GitMerge,
  Zap,
} from 'lucide-react';

const navItems = [
  { to: '/reports', label: 'Báo cáo & Phân tích', icon: BarChart3 },
  { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/my-schedule', label: 'Lịch đi làm', icon: CalendarDays },
  { to: '/departments', label: 'Phòng ban', icon: Building2 },
  { to: '/people', label: 'Nhân sự', icon: Users },
  { to: '/documents', label: 'Hồ sơ & Tuân thủ', icon: FileCheck },
  { to: '/workflows', label: 'Quy trình (Workflow)', icon: GitMerge },
  { to: '/automation', label: 'Tự động hóa', icon: Zap },
  { to: '/tasks', label: 'Công việc', icon: CheckSquare },
  { to: '/calendar', label: 'Lịch sự kiện', icon: CalendarDays },
  { to: '/leave', label: 'Nghỉ phép', icon: CalendarOff },
  { to: '/attendance', label: 'Chấm công', icon: Clock },
  { to: '/shifts', label: 'Ca làm việc', icon: Clock },
  { to: '/schedules', label: 'Phân ca', icon: CalendarDays },
  { to: '/approvals', label: 'Phê duyệt', icon: ClipboardCheck },
  { to: '/payroll', label: 'Tiền lương', icon: Banknote },
  { to: '/performance', label: 'Hiệu suất', icon: Award },
  { to: '/notifications', label: 'Thông báo', icon: Bell },
  { to: '/files', label: 'Tài liệu', icon: FolderOpen },
  { to: '/ai', label: 'Trợ lý AI', icon: Bot },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 h-full bg-slate-900 text-white flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Điều hướng chính"
      >
        {/* Logo / Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-sm font-bold">
              DX
            </div>
            <span className="font-semibold text-lg">DX-OS</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-slate-800"
            aria-label="Đóng menu điều hướng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1" role="list">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800">
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )
            }
          >
            <Settings className="h-5 w-5 shrink-0" aria-hidden="true" />
            Cài đặt
          </NavLink>
        </div>
      </aside>
    </>
  );
}
