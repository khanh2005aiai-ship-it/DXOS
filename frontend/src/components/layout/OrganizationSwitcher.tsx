import { useState, useRef, useEffect } from 'react';
import { Building, ChevronDown, Check } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { clsx } from 'clsx';

export function OrganizationSwitcher() {
  const { currentOrg, organizations, setCurrentOrg } = useOrganization();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentOrg) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-sm font-medium text-slate-700"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Chuyển đổi tổ chức"
      >
        <Building className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <span className="truncate max-w-[200px]">{currentOrg.name}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </button>

      {open && organizations.length > 1 && (
        <div
          className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50"
          role="listbox"
          aria-label="Danh sách tổ chức"
        >
          {organizations.map((org) => (
            <button
              key={org.id}
              role="option"
              aria-selected={org.id === currentOrg.id}
              onClick={() => {
                setCurrentOrg(org);
                setOpen(false);
              }}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-slate-50',
                org.id === currentOrg.id && 'bg-brand-50'
              )}
            >
              <Building className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
              <span className="truncate flex-1">{org.name}</span>
              {org.id === currentOrg.id && (
                <Check className="h-4 w-4 text-brand-600 shrink-0" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
