import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { mapUser, type LocalUser } from '../lib/auth';

type AuthState = { user: LocalUser | null; loading: boolean };

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase oturum durumunu dinle — e-postası doğrulanmamış kullanıcı "giriş yapmamış" sayılır
    const unsub = onAuthStateChanged(auth, fbUser => {
      setUser(fbUser && fbUser.emailVerified ? mapUser(fbUser) : null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
