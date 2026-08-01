import React from 'react';
import { Database } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Database,
  title = 'No Data Found',
  description = 'There are no records available at this time.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/40 ${className}`}
    >
      <div className="p-4 rounded-2xl bg-slate-800/60 text-emerald-400 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-lg font-semibold text-slate-200">{title}</h4>
      <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
