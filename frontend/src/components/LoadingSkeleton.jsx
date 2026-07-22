import styles from './LoadingSkeleton.module.css';

export default function LoadingSkeleton({ type = 'card', count = 3 }) {
  if (type === 'chart') {
    return (
      <div className={styles.chart}>
        <div className={styles.shimmer} />
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className={styles.textBlock}>
        <div className={`${styles.line} ${styles.wide}`} />
        <div className={styles.line} />
        <div className={`${styles.line} ${styles.narrow}`} />
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.shimmer} />
          <div className={`${styles.line} ${styles.wide}`} />
          <div className={styles.line} />
        </div>
      ))}
    </div>
  );
}
