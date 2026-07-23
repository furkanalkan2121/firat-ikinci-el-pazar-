import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getCurrentUser, signOutLocal, type LocalUser } from '../lib/localAuth';

type AuthState = { user: LocalUser | null; loading: boolean };

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // localStorage'dan mevcut kullanıcıyı oku
    setUser(getCurrentUser());
    setLoading(false);

    // storage event: başka sekme/pencerede oturum değişirse senkronize et
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'fu_current_user') setUser(getCurrentUser());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/** Oturumu kapat ve context'i güncelle (Header'dan çağrılır) */
export function useSignOut() {
  const [, forceUpdate] = useState(0);
  return () => {
    signOutLocal();
    forceUpdate(n => n + 1);
    window.dispatchEvent(new StorageEvent('storage', { key: 'fu_current_user' }));
  };
}
