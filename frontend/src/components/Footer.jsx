import { Dna, Github, Shield, Mail } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer} id="contact">
      <div className={styles.brandCol}>
        <div className={styles.footerLogo}>
          <div className={styles.footerLogoIcon}>
            <Dna size={18} />
          </div>
          <strong>GenomeAI</strong>
        </div>
        <p>AI-Powered DNA Disease Prediction Platform</p>
      </div>

      <div className={styles.links}>
        <a href="/predict">
          <span>Predict DNA</span>
        </a>
        <a href="https://github.com" target="_blank" rel="noreferrer">
          <Github size={15} />
          GitHub
        </a>
        <a href="#">
          <Shield size={15} />
          Privacy
        </a>
        <a href="mailto:hello@genomeai.com">
          <Mail size={15} />
          Contact
        </a>
      </div>

      <div className={styles.copy}>
        &copy; {new Date().getFullYear()} GenomeAI. All rights reserved.
      </div>
    </footer>
  );
}

