-- Bảng I.4 — CÔNG VIỆC CỦA THƯ KÝ (bld-cong-viec-thu-ky)
-- Chạy trên Supabase SQL Editor nếu DB đã có schema cũ (chưa có i_4).

create table if not exists public.i_4 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.i_4 enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'i_4' and policyname = 'anon_select_i_4'
  ) then
    create policy "anon_select_i_4" on public.i_4 for select to anon using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'i_4' and policyname = 'anon_insert_i_4'
  ) then
    create policy "anon_insert_i_4" on public.i_4 for insert to anon with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'i_4' and policyname = 'anon_update_i_4'
  ) then
    create policy "anon_update_i_4" on public.i_4 for update to anon using (true) with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'i_4' and policyname = 'anon_delete_i_4'
  ) then
    create policy "anon_delete_i_4" on public.i_4 for delete to anon using (true);
  end if;
end $$;
