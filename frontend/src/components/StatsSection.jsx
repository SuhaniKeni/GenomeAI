import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import StatCard from './common/StatCard';
import styles from './StatsSection.module.css';

export default function StatsSection({ items }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <section className={styles.section} aria-labelledby="stats-title">
      <motion.div
        className={styles.heading}
        id="stats-title"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration: 0.7 }}
      >
        <span className={styles.kicker}>
          <BarChart3 size={14} />
          GenomeAI at a Glance
        </span>
        <h2>Key platform metrics with live, polished motion.</h2>
      </motion.div>

      <div className={styles.grid}>
        {items.map((item, index) => (
          <StatCard key={item.label} {...item} index={index} />
        ))}
      </div>
    </section>
  );
}

