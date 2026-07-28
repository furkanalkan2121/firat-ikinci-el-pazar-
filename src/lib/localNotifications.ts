/**
 * localNotifications.ts
 * Kullanıcı bildirimleri (Fiyat düşüşü, Favori ilan durumu vb.)
 */

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  listingId?: string;
  type: 'price_drop' | 'sold' | 'system';
  createdAt: string;
  read: boolean;
};

const NOTIFICATIONS_KEY = 'fu_notifications';

function getAll(): AppNotification[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(NOTIFICATIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveAll(items: AppNotification[]): void {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent('fu_notifications_updated'));
}

export function getUserNotifications(userId: string): AppNotification[] {
  return getAll()
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getUnreadNotificationCount(userId: string): number {
  return getUserNotifications(userId).filter(n => !n.read).length;
}

export function addNotification(n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): void {
  const items = getAll();
  const newItem: AppNotification = {
    ...n,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  items.unshift(newItem);
  saveAll(items);
}

export function markNotificationAsRead(notifId: string): void {
  const items = getAll();
  const index = items.findIndex(n => n.id === notifId);
  if (index !== -1) {
    items[index].read = true;
    saveAll(items);
  }
}

export function markAllNotificationsAsRead(userId: string): void {
  const items = getAll();
  let changed = false;
  items.forEach(n => {
    if (n.userId === userId && !n.read) {
      n.read = true;
      changed = true;
    }
  });
  if (changed) saveAll(items);
}
