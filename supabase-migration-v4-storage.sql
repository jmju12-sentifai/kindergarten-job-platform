-- =============================================
-- 교집합 Schema Migration v4 — Storage Buckets
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 프로필 사진 버킷
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 기관 전경 사진 버킷
insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

-- 누구나 읽기 가능 (public bucket)
create policy "Public read avatars" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "Public read photos" on storage.objects for select
  using (bucket_id = 'photos');

-- 인증된 사용자만 업로드/삭제
create policy "Auth upload avatars" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Auth upload photos" on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');
create policy "Own delete avatars" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Own delete photos" on storage.objects for delete
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
