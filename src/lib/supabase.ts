import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          try {
            return document.cookie.split(';').map((c) => {
              const [name, ...rest] = c.trim().split('=');
              return { name, value: decodeURIComponent(rest.join('=')) };
            }).filter((c) => c.name);
          } catch {
            return [];
          }
        },
        setAll(cookies) {
          try {
            cookies.forEach(({ name, value, options }) => {
              let cookie = `${name}=${encodeURIComponent(value)}; path=${options?.path || '/'}`;
              if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
              if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
              if (options?.secure) cookie += `; secure`;
              document.cookie = cookie;
            });
          } catch {
            // 쿠키 설정 실패해도 크래시 방지
          }
        },
      },
    }
  );
  return client;
}
