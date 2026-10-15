import { ShieldX } from 'lucide-react';

interface ForbiddenStateProps {
  message?: string;
}

export function ForbiddenState({ message = 'Bạn không có quyền truy cập vào tài nguyên này.' }: ForbiddenStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-amber-50 p-4 mb-4">
        <ShieldX className="h-8 w-8 text-amber-500" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">Truy cập bị từ chối</h3>
      <p className="text-sm text-slate-500 max-w-sm">{message}</p>
    </div>
  );
}
