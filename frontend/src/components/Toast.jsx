import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={16} className={styles.iconSuccess} />,
    error: <AlertCircle size={16} className={styles.iconError} />,
    info: <Info size={16} className={styles.iconInfo} />,
  };

  return (
    <AnimatePresence>
      <motion.div
        className={`${styles.toast} ${styles[toast.type || 'info']}`}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        role="alert"
        aria-live="polite"
      >
        <div className={styles.content}>
          {icons[toast.type || 'info']}
          <span className={styles.message}>{toast.message}</span>
        </div>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close notification">
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
