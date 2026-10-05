import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INotification } from '../types';
import { notificationApi } from '../api/adminApi';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: INotification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id?: string) => Promise<void>;
  toasts: { id: string; title: string; message: string; type: string }[];
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; type: string }[]>([]);
  const { socket } = useSocket();
  const { isAuthenticated, user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationApi.getNotifications();
      if (res.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('[NotificationContext] Error fetching notifications:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Real-time socket events for notifications & toast alerts
  useEffect(() => {
    if (!socket) return;

    const handleToast = (title: string, message: string, type: string = 'info') => {
      const toastId = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id: toastId, title, message, type }]);
      fetchNotifications();

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastId));
      }, 6000);
    };

    socket.on('NEW_WORK_REQUEST', (data) => {
      handleToast(
        'New Work Request Available',
        `New request in ${data.district} for ${data.quantity} loom(s).`,
        'info'
      );
    });

    socket.on('QUOTE_RECEIVED', (data) => {
      handleToast(
        'Quotation Received!',
        `${data.workerName} sent a quote of ₹${data.totalAmount} for ${data.requestId}`,
        'success'
      );
    });

    socket.on('QUOTE_ACCEPTED', (data) => {
      handleToast(
        '🎉 Quote Accepted & Job Assigned!',
        `${data.weaverName} accepted your quote of ₹${data.amount} for ${data.requestId}`,
        'success'
      );
    });

    socket.on('JOB_STATUS_UPDATED', (data) => {
      handleToast(
        `Job ${data.jobId} Status Updated`,
        `Status changed to: ${data.status} by ${data.updatedBy}`,
        'info'
      );
    });

    return () => {
      socket.off('NEW_WORK_REQUEST');
      socket.off('QUOTE_RECEIVED');
      socket.off('QUOTE_ACCEPTED');
      socket.off('JOB_STATUS_UPDATED');
    };
  }, [socket, fetchNotifications]);

  const markAsRead = async (id: string = 'all') => {
    try {
      await notificationApi.markAsRead(id);
      if (id === 'all') {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      } else {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('[NotificationContext] Error marking as read:', err);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        toasts,
        removeToast
      }}
    >
      {children}
      {/* Toast popup notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-slate-900 text-white p-4 rounded-xl shadow-2xl border-l-4 border-amber-500 flex items-start justify-between gap-3 animate-slide-in"
          >
            <div>
              <h4 className="font-semibold text-sm text-amber-400">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-1">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
