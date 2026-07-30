/**
 * authGate.ts
 * Giriş yapılmamışsa işlemi engelleyip kullanıcıyı giriş sayfasına yönlendiren yardımcı hook.
 * Kullanım:
 *   const requireAuth = useAuthGate();
 *   const onClick = () => { if (!requireAuth('Bunun için giriş yapın.')) return; ...işlem... };
 */
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function useAuthGate() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  return (message = 'Bu işlem için lütfen giriş yapın.'): boolean => {
    if (user) return true;
    showToast(message, 'info');
    router.push('/auth/signin');
    return false;
  };
}
