
'use client';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMounted } from '@/hooks/use-mounted';

export default function RoleGuard({ children, roles }: { children: React.ReactNode, roles: string[] }) {
  const { currentUser } = useAppStore();
  const router = useRouter();
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    
    if (!currentUser) {
      router.push('/login');
    } else if (roles.length > 0 && !roles.includes(currentUser.role)) {
      router.push('/dashboard');
    }
  }, [currentUser, router, roles, mounted]);

  if (!mounted) return null;

  if (!currentUser || (roles.length > 0 && !roles.includes(currentUser.role))) {
    return null;
  }

  return <>{children}</>;
}
