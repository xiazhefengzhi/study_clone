'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        try {
          // 调用后端 API 同步用户资料
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

          const response = await fetch(`${apiUrl}/api/v1/auth/sync-profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // 关键：将 Supabase 的 access_token 传给后端验证
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (!response.ok) {
            console.error('Failed to sync user profile:', await response.text());
          } else {
            console.log('User profile synced successfully');
          }

          // 刷新路由以更新服务端组件状态
          router.refresh();
        } catch (error) {
          console.error('Error syncing profile:', error);
        }
      }

      if (event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return <>{children}</>;
}
