-- Thêm bảng ghi chú (chạy nếu project đã có schema cũ, không cần drop toàn bộ)
-- Supabase → SQL Editor → Run

create table if not exists public.ghi_chu_phong_ban (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ghi_chu_phong_ban enable row level security;
drop policy if exists "anon_select_ghi_chu_phong_ban" on public.ghi_chu_phong_ban;
drop policy if exists "anon_insert_ghi_chu_phong_ban" on public.ghi_chu_phong_ban;
drop policy if exists "anon_update_ghi_chu_phong_ban" on public.ghi_chu_phong_ban;
drop policy if exists "anon_delete_ghi_chu_phong_ban" on public.ghi_chu_phong_ban;
create policy "anon_select_ghi_chu_phong_ban" on public.ghi_chu_phong_ban for select to anon using (true);
create policy "anon_insert_ghi_chu_phong_ban" on public.ghi_chu_phong_ban for insert to anon with check (true);
create policy "anon_update_ghi_chu_phong_ban" on public.ghi_chu_phong_ban for update to anon using (true) with check (true);
create policy "anon_delete_ghi_chu_phong_ban" on public.ghi_chu_phong_ban for delete to anon using (true);

create table if not exists public.ghi_chu_chung (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ghi_chu_chung enable row level security;
drop policy if exists "anon_select_ghi_chu_chung" on public.ghi_chu_chung;
drop policy if exists "anon_insert_ghi_chu_chung" on public.ghi_chu_chung;
drop policy if exists "anon_update_ghi_chu_chung" on public.ghi_chu_chung;
drop policy if exists "anon_delete_ghi_chu_chung" on public.ghi_chu_chung;
create policy "anon_select_ghi_chu_chung" on public.ghi_chu_chung for select to anon using (true);
create policy "anon_insert_ghi_chu_chung" on public.ghi_chu_chung for insert to anon with check (true);
create policy "anon_update_ghi_chu_chung" on public.ghi_chu_chung for update to anon using (true) with check (true);
create policy "anon_delete_ghi_chu_chung" on public.ghi_chu_chung for delete to anon using (true);

notify pgrst, 'reload schema';
