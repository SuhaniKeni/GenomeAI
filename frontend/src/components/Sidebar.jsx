import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Dna, FileText, Clock, Users, Building2,
  Settings, Info, LogOut, ChevronLeft, ChevronRight, ShieldCheck, User, FileCheck
} from 'lucide-react';

import { fetchCurrentUser, logoutUser } from '../api/client';
import styles from './Sidebar.module.css';

const sidebarNavLinks = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'New DNA Analysis', to: '/analysis', icon: Dna },
  { label: 'Analysis History', to: '/history', icon: Clock },
  { label: 'Supporting Evidence', to: '/evidence', icon: FileCheck },
  { label: 'Reports', to: '/reports', icon: FileText },
  { label: 'Laboratory Users', to: '/users', icon: Users },
  { label: 'Laboratory Management', to: '/lab-management', icon: Building2 },
  { label: 'Settings', to: '/settings', icon: Settings },
  { label: 'About', to: '/about', icon: Info },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1100);
  const [userProfile, setUserProfile] = useState({
    name: 'Dr. Sarah Jenkins',
    role: 'Administrator',
    labName: 'Central Genomics Institute',
  });

  useEffect(() => {
    // Dynamically set CSS custom property --sidebar-width (reduced width for LIS density)
    const width = collapsed ? '64px' : '212px';
    document.documentElement.style.setProperty('--sidebar-width', width);
  }, [collapsed]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1100) {
        setCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const data = await fetchCurrentUser();
        if (mounted && data.user) {
          setUserProfile({
            name: data.user.full_name || 'Dr. Sarah Jenkins',
            role: data.user.role || 'Administrator',
            labName: data.laboratory?.name || 'Central Genomics Institute',
          });
        }
      } catch {
        // Keeps default active session info if offline
      }
    };
    loadProfile();
  }, []);


  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <motion.aside
      className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Brand Header */}
      <div className={styles.brandHead}>
        <Link to="/" className={styles.brandLink}>
          <div className={styles.logoWrap}>
            <Dna size={22} className={styles.dnaIcon} />
          </div>
          {!collapsed && (
            <div className={styles.brandText}>
              <span className={styles.brandName}>GenomeAI</span>
              <span className={styles.brandSub}>Enterprise LIS</span>
            </div>
          )}
        </Link>

        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className={styles.navGroup}>
        {sidebarNavLinks.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`${styles.navItem} ${active ? styles.active : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className={styles.navIcon} />
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Lab Info Card */}
      <div className={styles.bottomCard}>
        {!collapsed && (
          <div className={styles.userMeta}>
            <div className={styles.avatarWrap}>
              <User size={18} />
            </div>
            <div className={styles.userInfo}>
              <strong className={styles.userName}>{userProfile.name}</strong>
              <span className={styles.labName}>{userProfile.labName}</span>
              <span className={styles.roleChip}>{userProfile.role}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          className={styles.logoutBtn}
          onClick={handleLogout}
          title="Sign out of LIS"
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
