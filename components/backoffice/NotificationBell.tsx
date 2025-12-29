'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import type { NotificationResponse } from '@/types/notification.types';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await apiClient.get('/api/notifications') as any;
      if (data.success) {
        setNotifications(data.data.notifications || []);
        setUnreadCount(data.data.unreadCount || 0);
      }
    } catch (err) {
      // Handle auth errors gracefully without logging
      if (err instanceof Error && err.message === 'No valid access token') {
        // Auth error handled by apiClient (redirect), no need to log
        return;
      }
      console.error('Failed to fetch notifications:', err);
      // If auth error, the apiClient handles redirect
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.post(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      // Handle auth errors gracefully without logging
      if (err instanceof Error && err.message === 'No valid access token') {
        // Auth error handled by apiClient (redirect), no need to log
        return;
      }
      console.error('Failed to mark as read:', err);
      // If auth error, the apiClient handles redirect
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmed':
        return '✅';
      case 'booking_cancelled':
        return '❌';
      case 'payment_received':
        return '💰';
      case 'invoice_generated':
        return '📄';
      case 'expense_approved':
        return '✔️';
      case 'expense_rejected':
        return '❌';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-luxury-text hover:text-[hsl(var(--color-luxury-dark))]"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-luxury-cream transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-luxury-dark">Notifications</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-[hsl(var(--color-luxury-text))]/90">
              Aucune notification
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''
                    }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      <p className="text-sm text-luxury-text">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
