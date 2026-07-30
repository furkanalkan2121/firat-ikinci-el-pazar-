/**
 * localNotifications.ts
 * Kullanıcı bildirimleri (fiyat düşüşü vb.) — Firebase Firestore tabanlı.
 * Koleksiyon: notifications
 */
import { db } from './firebase';
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where,
} from 'firebase/firestore';

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

const COL = 'notifications';

function emitUpdated() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('fu_notifications_updated'));
}

export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  if (!userId) return [];
  try {
    const snap = await getDocs(query(collection(db, COL), where('userId', '==', userId)));
    return snap.docs
      .map(d => ({ ...(d.data() as any), id: d.id } as AppNotification))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const items = await getUserNotifications(userId);
  return items.filter(n => !n.read).length;
}

export async function addNotification(n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<void> {
  const clean: Record<string, any> = { createdAt: new Date().toISOString(), read: false };
  Object.entries(n).forEach(([k, v]) => { if (v !== undefined) clean[k] = v; });
  await addDoc(collection(db, COL), clean);
  emitUpdated();
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  await updateDoc(doc(db, COL, notifId), { read: true });
  emitUpdated();
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!userId) return;
  const snap = await getDocs(query(collection(db, COL), where('userId', '==', userId)));
  const unread = snap.docs.filter(d => !(d.data() as any).read);
  await Promise.all(unread.map(d => updateDoc(d.ref, { read: true })));
  if (unread.length) emitUpdated();
}

export async function deleteUserNotifications(userId: string): Promise<void> {
  if (!userId) return;
  const snap = await getDocs(query(collection(db, COL), where('userId', '==', userId)));
  await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
}
