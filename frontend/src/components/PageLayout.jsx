import ParticleBackground from './ParticleBackground';
import Navbar from './Navbar';
import styles from './PageLayout.module.css';

export default function PageLayout({ title, subtitle, children, wide }) {
  return (
    <div className={styles.page}>
      <ParticleBackground />
      <Navbar />
      <main className={`${styles.main} ${wide ? styles.wide : ''}`}>
        {(title || subtitle) && (
          <div className={styles.header}>
            {title && <h1 className={styles.title}>{title}</h1>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
