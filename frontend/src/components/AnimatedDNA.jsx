import { motion, useReducedMotion } from 'framer-motion';
import { Dna } from 'lucide-react';
import dnaHero from '../../dna-hero.svg';
import styles from './AnimatedDNA.module.css';

export default function AnimatedDNA() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={styles.stage}
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, ease: 'easeOut' }}
    >
      {/* Glow halo */}
      <div className={styles.halo} />

      {/* Orbital rings */}
      <div className={`${styles.ring} ${styles.ringOne}`} />
      <div className={`${styles.ring} ${styles.ringTwo}`} />
      <div className={`${styles.ring} ${styles.ringThree}`} />

      {/* DNA Helix SVG */}
      <img className={styles.helix} src={dnaHero} alt="DNA Helix" />

      {/* Floating medical particles */}
      <div className={`${styles.particle} ${styles.p1}`} />
      <div className={`${styles.particle} ${styles.p2}`} />
      <div className={`${styles.particle} ${styles.p3}`} />

      {/* Binary code accents */}
      <div className={`${styles.binary} ${styles.binaryA}`}>0101</div>
      <div className={`${styles.binary} ${styles.binaryB}`}>0011</div>
      <div className={`${styles.binary} ${styles.binaryC}`}>1010</div>

      {/* Nucleotide base nodes */}
      <div className={`${styles.node} ${styles.nodeA}`}>
        <Dna size={10} />
      </div>
      <div className={`${styles.node} ${styles.nodeG}`}>
        <Dna size={10} />
      </div>
      <div className={`${styles.node} ${styles.nodeC}`}>
        <Dna size={10} />
      </div>
      <div className={`${styles.node} ${styles.nodeT}`}>
        <Dna size={10} />
      </div>
    </motion.div>
  );
}

