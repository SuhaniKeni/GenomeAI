import React from 'react';
import { motion } from 'framer-motion';

export function Card({
  children,
  className = '',
  hoverable = false,
  gradient = false,
  glow = false,
  ...props
}) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -3, transition: { duration: 0.2 } } : {}}
      className={`relative rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl overflow-hidden ${
        gradient ? 'bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/90 border-emerald-500/25' : ''
      } ${
        glow ? 'shadow-emerald-950/30 border-emerald-500/30' : ''
      } ${
        hoverable ? 'hover:border-emerald-500/40 hover:shadow-emerald-950/30 transition-all duration-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className = '', title, subtitle, action, icon: Icon }) {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          {title && <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          {children}
        </div>
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
