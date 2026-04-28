import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server components / route handlers / server actions에서 사용.
// 쿠키 읽기/쓰기는 Next.js cookies() 스토어를 통해서 처리하며,
// route handler/server action에서는 자동으로 응답에 Set-Cookie가 반영된다.
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // server component에서는 setAll 불가. proxy/route handler가 cookie 갱신 책임.
          }
        },
      },
    }
  );
}
