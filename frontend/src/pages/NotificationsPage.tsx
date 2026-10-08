import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  RefreshCw,
  MailCheck,
  CheckCheck,
  ShieldCheck,
  Filter,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'ALERT'>('ALL');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    for (const item of unread) {
      try {
        await apiClient.patch(`/notifications/${item.id}/read`);
      } catch (e) {
        // ignore
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'QUALIFICATION':
      case 'SUCCESS':
        return <CheckCircle2 size={18} color="#10b981" />;
      case 'WARNING':
        return <AlertTriangle size={18} color="#f59e0b" />;
      default:
        return <Info size={18} color="#3b82f6" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'ALERT') return n.type === 'WARNING';
    return true;
  });

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.92))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.5)',
          padding: '1.75rem 2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bell size={24} color="#60a5fa" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                Notifications & Advisories
              </h1>
              {unreadCount > 0 && (
                <span
                  style={{
                    padding: '0.15rem 0.6rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                  }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
              Real-time regulatory audit alerts, verification status, and Educaro advisor updates.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.55rem 0.95rem' }}
            >
              <CheckCheck size={15} />
              <span>Mark all read</span>
            </button>
          )}

          <button
            onClick={fetchNotifications}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', padding: '0.55rem 0.95rem' }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[
          { key: 'ALL', label: `All (${notifications.length})` },
          { key: 'UNREAD', label: `Unread (${unreadCount})` },
          { key: 'ALERT', label: `Alerts (${notifications.filter((n) => n.type === 'WARNING').length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key as any)}
            style={{
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: filter === t.key ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.06)',
              background: filter === t.key ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.6)',
              color: filter === t.key ? '#60a5fa' : '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem' }}>
            <RefreshCw className="animate-spin" size={28} color="#3b82f6" />
            <p style={{ marginTop: '0.75rem', color: '#94a3b8', fontSize: '0.85rem' }}>Checking notifications...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '1.2rem',
                borderRadius: '10px',
                background: n.isRead ? 'rgba(15, 23, 42, 0.4)' : 'rgba(37, 99, 235, 0.08)',
                border: '1px solid',
                borderColor: n.isRead ? 'rgba(255, 255, 255, 0.06)' : 'rgba(59, 130, 246, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  marginTop: '0.15rem',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {getNotificationIcon(n.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    {n.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                      {new Date(n.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          cursor: 'pointer',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                        }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {n.message}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
            <MailCheck size={36} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
            <div>No notifications in this category. You're up to date!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
