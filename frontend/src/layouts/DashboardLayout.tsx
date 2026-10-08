import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Compass,
  Bot,
  User,
  FileText,
  Award,
  Briefcase,
  ArrowRightCircle,
  Map,
  FileCheck2,
  FileEdit,
  GraduationCap,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  ShieldCheck,
  BarChart3,
  Sliders,
  Layers,
  Database,
  Eye,
  Video,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout, isApplicant, isConsultant, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const applicantNav = [
    { name: 'Dashboard', path: '/dashboard', icon: Compass },
    { name: 'AI Assistant', path: '/assistant', icon: Bot },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Video Intro', path: '/video', icon: Eye },
    { name: 'Qualification', path: '/qualification', icon: Award },
    { name: 'Opportunities', path: '/opportunities', icon: Briefcase },
    { name: 'Next Step', path: '/next-step', icon: ArrowRightCircle },
    { name: 'My Journey', path: '/journey', icon: Map },
    { name: 'CV Builder', path: '/cv', icon: FileCheck2 },
    { name: 'Cover Letter', path: '/cover-letter', icon: FileEdit },
    { name: 'Live Video Interview', path: '/interview', icon: Video },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const consultantNav = [
    { name: 'Consultant Dashboard', path: '/consultant', icon: Compass },
    { name: 'Assigned Applicants', path: '/consultant/applicants', icon: Users },
    { name: 'Review Queue', path: '/consultant/reviews', icon: ShieldCheck },
    { name: 'Candidate Video Interviews', path: '/interview', icon: Video },
  ];

  const adminNav = [
    { name: 'Admin Overview', path: '/admin', icon: Compass },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Opportunities', path: '/admin/opportunities', icon: Briefcase },
    { name: 'Requirements', path: '/admin/requirements', icon: Sliders },
    { name: 'Educaro Services', path: '/admin/services', icon: Layers },
    { name: 'Routing Rules', path: '/admin/routing-rules', icon: Database },
    { name: 'Agent Executions', path: '/admin/agents', icon: Bot },
    { name: 'Video Interview Panel', path: '/interview', icon: Video },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
  ];

  let currentNav = applicantNav;
  if (isConsultant) currentNav = consultantNav;
  if (isAdmin) currentNav = adminNav;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: '260px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
        }}
        className="hidden-mobile"
      >
        {/* Brand */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.1rem',
              }}
            >
              N
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                Nexora
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
                Germany Journey Platform
              </div>
            </div>
          </Link>
        </div>

        {/* User Role Tag */}
        <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
            {user?.role === 'APPLICANT' ? 'Applicant Portal' : user?.role === 'CONSULTANT' ? 'Educaro Advisor' : 'System Admin'}
          </span>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0.75rem' }}>
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  marginBottom: '0.2rem',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : '#94a3b8',
                  background: isActive ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={17} color={isActive ? '#60a5fa' : '#64748b'} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile and Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.email}
              </div>
            </div>
            <button
              onClick={() => logout()}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '6px',
              }}
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: '60px',
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'none',
              }}
              className="show-mobile-btn"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>
              Nexora <span style={{ color: '#475569' }}>/</span> <span style={{ color: '#fff', fontWeight: 600 }}>{location.pathname.replace('/', '').toUpperCase() || 'HOME'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/notifications"
              style={{
                color: '#94a3b8',
                textDecoration: 'none',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Bell size={18} />
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                }}
              />
            </Link>
            <div
              style={{
                fontSize: '0.75rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(37, 99, 235, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {user?.role?.toLowerCase() || 'applicant'}
            </div>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div
            style={{
              position: 'fixed',
              top: '60px',
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.98)',
              zIndex: 50,
              padding: '1rem',
              overflowY: 'auto',
            }}
          >
            {currentNav.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  color: location.pathname === item.path ? '#60a5fa' : '#cbd5e1',
                  background: location.pathname === item.path ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            ))}
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <button
                onClick={() => logout()}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile-btn { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardLayout;
