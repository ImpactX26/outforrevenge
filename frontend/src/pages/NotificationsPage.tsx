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

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Bell size={24} color="#60a5fa" />
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Notifications Inbox
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
              System updates, agent alerts, and Educaro advisor recommendations.
            </p>
          </div>
        </div>

        <button
          onClick={fetchNotifications}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <RefreshCw className="animate-spin" size={26} color="#3b82f6" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                padding: '1rem',
                borderRadius: '8px',
                background: n.isRead ? 'rgba(15, 23, 42, 0.3)' : 'rgba(37, 99, 235, 0.08)',
                border: '1px solid',
                borderColor: n.isRead ? 'var(--border-subtle)' : 'rgba(59, 130, 246, 0.3)',
              }}
            >
              <div style={{ marginTop: '0.15rem' }}>{getNotificationIcon(n.type)}</div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    {n.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#38bdf8',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                  {n.message}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            Your inbox is empty. No notifications right now.
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
