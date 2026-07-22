import styles from './ParticleBackground.module.css';

const particles = Array.from({ length: 30 }, (_, index) => ({
  id: index,
  top: `${6 + ((index * 9) % 88)}%`,
  left: `${3 + ((index * 13) % 94)}%`,
  size: 2 + (index % 4),
  delay: `${index * 0.3}s`,
  duration: `${10 + (index % 8)}s`,
  opacity: 0.2 + (index % 3) * 0.15,
}));

export default function ParticleBackground() {
  return (
    <div className={styles.background} aria-hidden="true">
      {/* Gradient blobs */}
      <div className={styles.blobOne} />
      <div className={styles.blobTwo} />
      <div className={styles.blobThree} />

      {/* Scientific grid overlay */}
      <div className={styles.grid} />

      {/* Subtle DNA watermark */}
      <div className={styles.watermark}>GenomeAI</div>

      {/* Floating particles */}
      {particles.map((particle) => (
        <span
          key={particle.id}
          className={styles.particle}
          style={{
            top: particle.top,
            left: particle.left,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
            opacity: particle.opacity,
          }}
        />
      ))}

      {/* Connection lines network */}
      <svg className={styles.network} viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <line x1="10%" y1="20%" x2="90%" y2="30%" className={styles.netLine} />
        <line x1="80%" y1="10%" x2="20%" y2="85%" className={styles.netLine} />
        <line x1="15%" y1="70%" x2="85%" y2="60%" className={styles.netLine} />
        <line x1="50%" y1="5%" x2="50%" y2="95%" className={styles.netLine} />
        <line x1="5%" y1="45%" x2="95%" y2="55%" className={styles.netLine} />
      </svg>
    </div>
  );
}

