import { motion, useReducedMotion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import styles from './FeatureCard.module.css';

const tones = {
  blue: styles.blue,
  teal: styles.teal,
  green: styles.green,
  purple: styles.purple,
};

const toneShadows = {
  blue: 'rgba(37, 99, 235, 0.25)',
  teal: 'rgba(6, 182, 212, 0.25)',
  green: 'rgba(34, 197, 94, 0.25)',
  purple: 'rgba(124, 58, 237, 0.25)',
};

export default function FeatureCard({ title, description, icon, tone, index }) {
  const shouldReduceMotion = useReducedMotion();

  const IconComponent = LucideIcons[icon] || LucideIcons.Brain;

  return (
    <motion.article
      className={styles.card}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
      whileHover={shouldReduceMotion ? {} : { y: -8, scale: 1.015 }}
    >
      <div
        className={`${styles.iconWrap} ${tones[tone]}`}
        style={{ boxShadow: `0 12px 28px ${toneShadows[tone]}` }}
      >
        <IconComponent size={28} strokeWidth={1.5} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
    </motion.article>
  );
}

