import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration: number;
  timestamp: Date;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      notifications: [],
      addNotification: (notification) => {
        const id = generateId();
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: new Date(),
        };

        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));

        // Auto-remove notification after duration
        if (notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);
        }
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
      clearAllNotifications: () =>
        set(() => ({
          notifications: [],
        })),
    }),
    {
      name: 'notification-store',
    }
  )
);

// Helper functions for common notification types
export const notificationHelpers = {
  success: (title: string, message: string, duration = 5000) =>
    useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
      duration,
    }),
  error: (title: string, message: string, duration = 8000) =>
    useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      duration,
    }),
  warning: (title: string, message: string, duration = 6000) =>
    useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      duration,
    }),
  info: (title: string, message: string, duration = 4000) =>
    useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
      duration,
    }),
};
