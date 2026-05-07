import { createClient } from '@supabase/supabase-js';

// Database 타입은 의도적으로 패스하지 않는다.
// 우리 Database 인터페이스는 supabase-js v2.103+의 GenericTable(Relationships 필드 요구)을
// 충족하지 못해서, 명시적으로 패스하면 모든 from() 호출이 never 타입으로 깨진다.
// 기존 createBrowserClient/createServerClient 와 동일하게 untyped(any)로 둔다.

let adminClient: ReturnType<typeof createClient> | null = null;

export function createAdminClient() {
  if (adminClient) return adminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
}
