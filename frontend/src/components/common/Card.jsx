import React from 'react';

export function Card({
  children,
  className = '',
  hoverable = false,
  gradient = false,
  ...props
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl p-6 shadow-xl transition-all duration-300 ${
        gradient ? 'bg-gradient-to-b from-slate-900/90 to-slate-950/90 border-emerald-500/20' : ''
      } ${
        hoverable ? 'hover:border-emerald-500/40 hover:shadow-emerald-950/20 hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', title, subtitle, action }) {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4 ${className}`}>
      <div>
        {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export default Card;
