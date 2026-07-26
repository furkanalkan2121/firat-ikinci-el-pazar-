/**
 * localMessages.ts
 * Alıcı-satıcı arası mesajlaşma sistemi (localStorage tabanlı).
 */

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

const MESSAGES_KEY = 'fu_messages';

export function makeConvId(listingId: string, uid1: string, uid2: string): string {
  return `${listingId}__${[uid1, uid2].sort().join('__')}`;
}

function getAll(): Message[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(MESSAGES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveAll(messages: Message[]): void {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
}

export function sendMessage(params: {
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  senderId: string;
  senderEmail: string;
  receiverId: string;
  receiverEmail: string;
  text: string;
}): Message {
  const messages = getAll();
  const convId = makeConvId(params.listingId, params.senderId, params.receiverId);
  const msg: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    conversationId: convId,
    listingId: params.listingId,
    listingTitle: params.listingTitle,
    senderId: params.senderId,
    senderEmail: params.senderEmail,
    receiverId: params.receiverId,
    receiverEmail: params.receiverEmail,
    text: params.text,
    createdAt: new Date().toISOString(),
    read: false,
  };
  messages.push(msg);
  saveAll(messages);

  // Tarayıcı Bildirimi Tetikle (Masaüstü Notification)
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`Yeni Mesaj: ${params.senderEmail.split('@')[0]}`, {
        body: params.text.length > 50 ? `${params.text.slice(0, 50)}…` : params.text,
        icon: '/favicon.ico',
      });
    } catch {}
  }

  return msg;
}

export function getConversationMessages(convId: string): Message[] {
  return getAll()
    .filter(m => m.conversationId === convId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getUserConversations(userId: string): Conversation[] {
  const messages = getAll().filter(m => m.senderId === userId || m.receiverId === userId);

  const convMap = new Map<string, Conversation>();
  // En eskiden yeniye işle, son mesaj doğru ayarlansın
  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

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

export function markConversationRead(convId: string, userId: string): void {
  const messages = getAll().map(m =>
    m.conversationId === convId && m.receiverId === userId ? { ...m, read: true } : m
  );
  saveAll(messages);
}

export function getTotalUnread(userId: string): number {
  return getAll().filter(m => m.receiverId === userId && !m.read).length;
}
