/**
 * localMessages.ts
 * Alıcı-satıcı mesajlaşma — Firebase Firestore tabanlı (gerçek, kullanıcılar arası, canlı).
 * Koleksiyon: messages
 */
import { db } from './firebase';
import {
  collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot,
} from 'firebase/firestore';

export type Message = {
  id: string;
  conversationId: string;    // `${listingId}__${[uid1,uid2].sort().join('__')}`
  listingId: string;
  listingTitle: string;
  senderId: string;
  senderEmail: string;
  receiverId: string;
  receiverEmail: string;
  text: string;
  imageDataUrl?: string;
  locationOffer?: string;
  createdAt: string;
  read: boolean;
};

export type Conversation = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  otherUserId: string;
  otherUserEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

const COL = 'messages';

export function makeConvId(listingId: string, uid1: string, uid2: string): string {
  return `${listingId}__${[uid1, uid2].sort().join('__')}`;
}

/** convId'den karşı tarafın uid'sini çöz (mesaj olmasa bile). */
export function getOtherUidFromConvId(convId: string, myUid: string): string {
  const parts = convId.split('__');
  if (parts.length < 3) return '';
  return parts.slice(1).find(u => u && u !== myUid) ?? '';
}

function emitUpdated() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('fu_messages_updated'));
}

export async function sendMessage(params: {
  conversationId: string;
  listingId: string;
  listingTitle: string;
  senderId: string;
  senderEmail: string;
  receiverId: string;
  receiverEmail: string;
  text: string;
  imageDataUrl?: string;
  locationOffer?: string;
}): Promise<void> {
  const clean: Record<string, any> = { createdAt: new Date().toISOString(), read: false };
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined) clean[k] = v; });
  await addDoc(collection(db, COL), clean);
  emitUpdated();

  // Masaüstü bildirimi
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`Yeni Mesaj: ${params.senderEmail.split('@')[0]}`, {
        body: params.text.length > 50 ? `${params.text.slice(0, 50)}…` : params.text,
        icon: '/favicon.ico',
      });
    } catch {}
  }
}

export async function getConversationMessages(convId: string): Promise<Message[]> {
  if (!convId) return [];
  const snap = await getDocs(query(collection(db, COL), where('conversationId', '==', convId)));
  return snap.docs
    .map(d => ({ ...(d.data() as any), id: d.id } as Message))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

/** Bir sohbeti canlı dinle (onSnapshot). Aboneliği iptal eden fonksiyon döner. */
export function subscribeConversation(convId: string, cb: (msgs: Message[]) => void): () => void {
  if (!convId) return () => {};
  const q = query(collection(db, COL), where('conversationId', '==', convId));
  return onSnapshot(q, snap => {
    const msgs = snap.docs
      .map(d => ({ ...(d.data() as any), id: d.id } as Message))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    cb(msgs);
  }, () => cb([]));
}

/** Kullanıcının dahil olduğu tüm mesajları getir (gönderen + alıcı sorguları birleştirilir). */
async function getUserMessages(userId: string): Promise<Message[]> {
  const [sent, received] = await Promise.all([
    getDocs(query(collection(db, COL), where('senderId', '==', userId))),
    getDocs(query(collection(db, COL), where('receiverId', '==', userId))),
  ]);
  const map = new Map<string, Message>();
  [...sent.docs, ...received.docs].forEach(d => map.set(d.id, { ...(d.data() as any), id: d.id } as Message));
  return Array.from(map.values());
}

function buildConversations(messages: Message[], userId: string): Conversation[] {
  const convMap = new Map<string, Conversation>();
  const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  for (const m of sorted) {
    const otherUserId    = m.senderId === userId ? m.receiverId    : m.senderId;
    const otherUserEmail = m.senderId === userId ? m.receiverEmail : m.senderEmail;
    const prev = convMap.get(m.conversationId);
    convMap.set(m.conversationId, {
      id: m.conversationId,
      listingId: m.listingId,
      listingTitle: m.listingTitle,
      otherUserId,
      otherUserEmail,
      lastMessage: m.text,
      lastMessageAt: m.createdAt,
      unreadCount: (prev?.unreadCount ?? 0) + (m.receiverId === userId && !m.read ? 1 : 0),
    });
  }
  return Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  if (!userId) return [];
  return buildConversations(await getUserMessages(userId), userId);
}

export async function markConversationRead(convId: string, userId: string): Promise<void> {
  if (!convId || !userId) return;
  const snap = await getDocs(query(collection(db, COL), where('conversationId', '==', convId)));
  const toMark = snap.docs.filter(d => {
    const m = d.data() as any;
    return m.receiverId === userId && !m.read;
  });
  await Promise.all(toMark.map(d => updateDoc(d.ref, { read: true })));
  if (toMark.length) emitUpdated();
}

export async function getTotalUnread(userId: string): Promise<number> {
  if (!userId) return 0;
  const snap = await getDocs(query(collection(db, COL), where('receiverId', '==', userId)));
  return snap.docs.filter(d => !(d.data() as any).read).length;
}

export async function deleteUserMessages(userId: string): Promise<void> {
  if (!userId) return;
  const msgs = await getUserMessages(userId);
  await Promise.all(msgs.map(m => deleteDoc(doc(db, COL, m.id))));
  emitUpdated();
}
