import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Dna, Clock, FileCheck, FileText, Users, Building2,
  Settings, Info, LogOut, ChevronLeft, ChevronRight, User, ShieldCheck
} from 'lucide-react';
import { fetchCurrentUser, logoutUser } from '../api/client';

const sidebarNavLinks = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'New Analysis', to: '/analysis', icon: Dna },
  { label: 'History', to: '/history', icon: Clock },
  { label: 'Evidence', to: '/evidence', icon: FileCheck },
  { label: 'Reports', to: '/reports', icon: FileText },
  { label: 'Users', to: '/users', icon: Users },
  { label: 'Lab Settings', to: '/lab-management', icon: Building2 },
  { label: 'Settings', to: '/settings', icon: Settings },
  { label: 'API Docs', to: '/about', icon: Info },
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
    const width = collapsed ? '72px' : '240px';
    document.documentElement.style.setProperty('--sidebar-width', width);
  }, [collapsed]);

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
        // Keeps default
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
    <aside
      className={`fixed left-0 top-16 bottom-0 z-30 transition-all duration-300 backdrop-blur-xl bg-[#040d12]/90 border-r border-emerald-900/40 flex flex-col justify-between p-3 ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      <div>
        {/* Toggle Collapse Button */}
        <div className="flex items-center justify-end mb-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-[#09181b] hover:bg-emerald-950/60 border border-emerald-900/40 text-emerald-300 hover:text-white transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {sidebarNavLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);

            return (
              <Link
                key={item.label}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-white border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'text-emerald-100/70 hover:text-white hover:bg-emerald-950/40'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : 'text-emerald-100/60'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="border-t border-emerald-900/40 pt-3">
        {!collapsed && (
          <div className="mb-3 p-2.5 rounded-xl bg-[#09181b]/90 border border-emerald-900/40">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-emerald-100 truncate">{userProfile.name}</p>
                <p className="text-[10px] text-emerald-300/60 truncate">{userProfile.labName}</p>
              </div>
            </div>
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {userProfile.role}
            </span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 hover:border-rose-500/30 border border-transparent transition-all ${
            collapsed ? 'justify-center' : ''
          }`}
          title="Sign out of LIS"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
