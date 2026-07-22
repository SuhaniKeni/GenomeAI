import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import FeatureCard from './FeatureCard.jsx';
import styles from './FeatureSection.module.css';

export default function FeatureSection({ items }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className={styles.section} id="about">
      <motion.div
        className={styles.heading}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7 }}
      >
        <span className={styles.kicker}>
          <Sparkles size={14} />
          Platform Capabilities
        </span>
        <h2>Precision-built for AI genomics workflows.</h2>
        <p>
          Every interaction is designed to feel premium, scientific, and
          investor-ready.
        </p>
      </motion.div>

      <div className={styles.grid}>
        {items.map((item, index) => (
          <FeatureCard key={item.title} {...item} index={index} />
        ))}
      </div>
    </section>
  );
}

