import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  Dna, Activity, ChevronDown, BarChart3, Database, Dna as DnaIcon,
  GitCompare, Stethoscope, FileText, Clock, Settings, Shield, BookOpen,
  Menu, X, ArrowRight
} from 'lucide-react';
import { fetchHealth } from '../api/client';
import styles from './Navbar.module.css';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Predict DNA', to: '/predict' },
  {
    label: 'Analysis',
    children: [
      { label: 'DNA Visualizer', to: '/dna-visualizer', icon: DnaIcon },
      { label: 'Mutation Analysis', to: '/mutation-analysis', icon: GitCompare },
    ],
  },
  {
    label: 'Dashboards',
    children: [
      { label: 'Model Comparison', to: '/model-dashboard', icon: BarChart3 },
      { label: 'Research Dashboard', to: '/research-dashboard', icon: Database },
      { label: 'Dataset Analytics', to: '/dataset-analytics', icon: Activity },
      { label: 'Doctor Dashboard', to: '/doctor-dashboard', icon: Stethoscope },
      { label: 'Admin Dashboard', to: '/admin', icon: Shield },
    ],
  },
  {
    label: 'Tools',
    children: [
      { label: 'Clinical Report', to: '/clinical-report', icon: FileText },
      { label: 'Prediction History', to: '/history', icon: Clock },
      { label: 'API Docs', to: '/api-docs', icon: BookOpen },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
];

function NavDropdown({ item, isActive, isOpen, onToggle }) {
  const location = useLocation();
  const childActive = item.children?.some(c => location.pathname.startsWith(c.to));

  return (
    <div
      className={`${styles.dropdown} ${childActive ? styles.active : ''}`}
      onMouseEnter={() => onToggle?.(item.label)}
      onMouseLeave={() => onToggle?.(null)}
    >
      <button className={styles.dropdownTrigger} aria-haspopup="true" aria-expanded={isOpen}>
        {item.label}
        <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.chevronUp : ''}`} />
      </button>
      {isOpen && (
        <div className={styles.dropdownMenu} role="menu">
          {item.children.map((child) => {
            const Icon = child.icon;
            const isChildActive = location.pathname.startsWith(child.to);
            return (
              <Link
                key={child.to}
                to={child.to}
                className={`${styles.dropdownItem} ${isChildActive ? styles.active : ''}`}
                role="menuitem"
                onClick={() => onToggle?.(null)}
              >
                {Icon && <Icon size={16} />}
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const shouldReduceMotion = useReducedMotion();
  const location = useLocation();
  const [apiOnline, setApiOnline] = useState(false);
  const [apiChecking, setApiChecking] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        await fetchHealth();
        if (mounted) setApiOnline(true);
      } catch {
        if (mounted) setApiOnline(false);
      } finally {
        if (mounted) setApiChecking(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    if (to.startsWith('/#')) return false;
    return location.pathname.startsWith(to);
  };

  const isChildActive = (children) =>
    children?.some(c => location.pathname.startsWith(c.to));

  return (
    <motion.nav
      className={styles.nav}
      initial={shouldReduceMotion ? false : { opacity: 0, y: -16 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className={styles.inner}>
        {/* Column 1: Logo (left) */}
        <div className={styles.leftCol}>
          <Link to="/" className={styles.brand}>
            <div className={styles.logoWrap}>
              <Dna size={22} className={styles.logoIcon} />
            </div>
            <div className={styles.brandText}>
              <span className={styles.brandName}>GenomeAI</span>
              <span className={styles.brandSub}>AI-Powered Genomics</span>
            </div>
          </Link>
        </div>

        {/* Column 2: Navigation (exactly viewport-centered) */}
        <div className={styles.navCol}>
          <div className={styles.navLinks}>
            {navLinks.map((link) =>
              link.children ? (
                <NavDropdown
                  key={link.label}
                  item={link}
                  isActive={isChildActive(link.children)}
                  isOpen={openDropdown === link.label}
                  onToggle={setOpenDropdown}
                />
              ) : (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`${styles.navLink} ${isActive(link.to) ? styles.active : ''}`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Column 3: Actions (right) */}
        <div className={styles.rightCol}>
          <div className={styles.apiStatus}>
            <span className={`${styles.statusDot} ${apiChecking ? styles.checking : apiOnline ? styles.online : styles.offline}`} />
            <span className={styles.statusLabel}>
              {apiChecking ? 'Checking...' : apiOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <button
            className={styles.hamburger}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className={styles.mobileMenu}
            initial={shouldReduceMotion ? false : { opacity: 0, y: -12, scale: 0.96 }}
            animate={shouldReduceMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className={styles.mobileLinks}>
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label} className={styles.mobileGroup}>
                    <span className={styles.mobileGroupLabel}>{link.label}</span>
                    {link.children.map((child) => {
                      const Icon = child.icon;
                      const isChildActive = location.pathname.startsWith(child.to);
                      return (
                        <Link
                          key={child.to}
                          to={child.to}
                          className={`${styles.mobileLink} ${isChildActive ? styles.active : ''}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {Icon && <Icon size={16} />}
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={`${styles.mobileLink} ${isActive(link.to) ? styles.active : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className={styles.mobileLinkDot} />
                    {link.label}
                  </Link>
                )
              )}
            </div>
            <div className={styles.mobileFooter}>
              <Link to="/predict" className={styles.mobileCta} onClick={() => setMobileMenuOpen(false)}>
                Start Prediction
                <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

