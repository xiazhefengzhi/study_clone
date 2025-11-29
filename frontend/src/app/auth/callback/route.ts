import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle error from OAuth or email verification
  if (error) {
    console.error('Auth callback error:', error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/sign-in?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    const cookieStore = cookies();

    // Create Supabase client with cookie handling
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    try {
      // Exchange code for session (session will be stored in cookies)
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Code exchange error:', exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/sign-in?error=${encodeURIComponent(exchangeError.message)}`
        );
      }

      // Sync user profile to local database (for OAuth users)
      if (data.session?.access_token) {
        try {
          const syncResponse = await fetch(`${apiUrl}/api/v1/auth/sync-profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.session.access_token}`,
            },
          });

          if (!syncResponse.ok) {
            console.error('Sync profile failed:', await syncResponse.text());
          } else {
            console.log('User profile synced successfully');
          }
        } catch (syncErr) {
          console.error('Sync profile error:', syncErr);
        }
      }
    } catch (err) {
      console.error('Auth callback exception:', err);
      return NextResponse.redirect(
        `${requestUrl.origin}/sign-in?error=${encodeURIComponent('验证失败，请重试')}`
      );
    }
  }

  // Redirect to user center after successful verification/login
  return NextResponse.redirect(`${requestUrl.origin}/learn/user-center`);
}
