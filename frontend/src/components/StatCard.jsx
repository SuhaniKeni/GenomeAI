import { motion, useReducedMotion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import useCountUp from '../hooks/useCountUp.js';
import styles from './StatCard.module.css';

const tones = {
  blue: styles.blue,
  teal: styles.teal,
  green: styles.green,
  purple: styles.purple,
};

const iconNames = {
  'CNN Accuracy': 'TrendingUp',
  'Supported Diseases': 'HeartPulse',
  'API Status': 'Activity',
  'Model': 'Cpu',
};

export default function StatCard({ label, value, tone, index }) {
  const shouldReduceMotion = useReducedMotion();
  const animatedValue = useCountUp(value);

  const IconComponent = LucideIcons[iconNames[label]] || LucideIcons.BarChart3;

  return (
    <motion.article
      className={styles.card}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.015 }}
    >
      <div className={`${styles.icon} ${tones[tone]}`}>
        <IconComponent size={20} strokeWidth={1.5} />
      </div>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{animatedValue}</strong>
    </motion.article>
  );
}

