-- Bảng công việc chi tiết (I.1 … IV.2) + BC định kỳ
-- Chạy TOÀN BỘ file này trong Supabase → SQL Editor → Run.
-- Phần DROP xóa bảng cũ nếu tạo sai schema (mất dữ liệu trong các bảng này).

drop table if exists public.i_1 cascade;
drop table if exists public.i_2 cascade;
drop table if exists public.i_3 cascade;
drop table if exists public.ii_1 cascade;
drop table if exists public.ii_2 cascade;
drop table if exists public.ii_3 cascade;
drop table if exists public.ii_4 cascade;
drop table if exists public.ii_5 cascade;
drop table if exists public.ii_6 cascade;
drop table if exists public.ii_7 cascade;
drop table if exists public.ii_8 cascade;
drop table if exists public.ii_9 cascade;
drop table if exists public.iii_1 cascade;
drop table if exists public.iii_2 cascade;
drop table if exists public.iii_3 cascade;
drop table if exists public.iv_1 cascade;
drop table if exists public.iv_2 cascade;
drop table if exists public.bc_dinh_ky cascade;

create table public.i_1 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.i_1 enable row level security;
create policy "anon_select_i_1" on public.i_1 for select to anon using (true);
create policy "anon_insert_i_1" on public.i_1 for insert to anon with check (true);
create policy "anon_update_i_1" on public.i_1 for update to anon using (true) with check (true);
create policy "anon_delete_i_1" on public.i_1 for delete to anon using (true);

create table public.i_2 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.i_2 enable row level security;
create policy "anon_select_i_2" on public.i_2 for select to anon using (true);
create policy "anon_insert_i_2" on public.i_2 for insert to anon with check (true);
create policy "anon_update_i_2" on public.i_2 for update to anon using (true) with check (true);
create policy "anon_delete_i_2" on public.i_2 for delete to anon using (true);

create table public.i_3 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.i_3 enable row level security;
create policy "anon_select_i_3" on public.i_3 for select to anon using (true);
create policy "anon_insert_i_3" on public.i_3 for insert to anon with check (true);
create policy "anon_update_i_3" on public.i_3 for update to anon using (true) with check (true);
create policy "anon_delete_i_3" on public.i_3 for delete to anon using (true);

create table public.ii_1 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ii_1 enable row level security;
create policy "anon_select_ii_1" on public.ii_1 for select to anon using (true);
create policy "anon_insert_ii_1" on public.ii_1 for insert to anon with check (true);
create policy "anon_update_ii_1" on public.ii_1 for update to anon using (true) with check (true);
create policy "anon_delete_ii_1" on public.ii_1 for delete to anon using (true);

create table public.ii_2 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ii_2 enable row level security;
create policy "anon_select_ii_2" on public.ii_2 for select to anon using (true);
create policy "anon_insert_ii_2" on public.ii_2 for insert to anon with check (true);
create policy "anon_update_ii_2" on public.ii_2 for update to anon using (true) with check (true);
create policy "anon_delete_ii_2" on public.ii_2 for delete to anon using (true);

create table public.ii_3 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ii_3 enable row level security;
create policy "anon_select_ii_3" on public.ii_3 for select to anon using (true);
create policy "anon_insert_ii_3" on public.ii_3 for insert to anon with check (true);
create policy "anon_update_ii_3" on public.ii_3 for update to anon using (true) with check (true);
create policy "anon_delete_ii_3" on public.ii_3 for delete to anon using (true);

create table public.ii_4 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ii_4 enable row level security;
create policy "anon_select_ii_4" on public.ii_4 for select to anon using (true);
create policy "anon_insert_ii_4" on public.ii_4 for insert to anon with check (true);
create policy "anon_update_ii_4" on public.ii_4 for update to anon using (true) with check (true);
create policy "anon_delete_ii_4" on public.ii_4 for delete to anon using (true);

create table public.ii_5 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ii_5 enable row level security;
create policy "anon_select_ii_5" on public.ii_5 for select to anon using (true);
create policy "anon_insert_ii_5" on public.ii_5 for insert to anon with check (true);
create policy "anon_update_ii_5" on public.ii_5 for update to anon using (true) with check (true);
create policy "anon_delete_ii_5" on public.ii_5 for delete to anon using (true);

create table public.ii_6 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ii_6 enable row level security;
create policy "anon_select_ii_6" on public.ii_6 for select to anon using (true);
create policy "anon_insert_ii_6" on public.ii_6 for insert to anon with check (true);
create policy "anon_update_ii_6" on public.ii_6 for update to anon using (true) with check (true);
create policy "anon_delete_ii_6" on public.ii_6 for delete to anon using (true);

create table public.ii_7 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ii_7 enable row level security;
create policy "anon_select_ii_7" on public.ii_7 for select to anon using (true);
create policy "anon_insert_ii_7" on public.ii_7 for insert to anon with check (true);
create policy "anon_update_ii_7" on public.ii_7 for update to anon using (true) with check (true);
create policy "anon_delete_ii_7" on public.ii_7 for delete to anon using (true);

create table public.ii_8 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ii_8 enable row level security;
create policy "anon_select_ii_8" on public.ii_8 for select to anon using (true);
create policy "anon_insert_ii_8" on public.ii_8 for insert to anon with check (true);
create policy "anon_update_ii_8" on public.ii_8 for update to anon using (true) with check (true);
create policy "anon_delete_ii_8" on public.ii_8 for delete to anon using (true);

create table public.ii_9 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ii_9 enable row level security;
create policy "anon_select_ii_9" on public.ii_9 for select to anon using (true);
create policy "anon_insert_ii_9" on public.ii_9 for insert to anon with check (true);
create policy "anon_update_ii_9" on public.ii_9 for update to anon using (true) with check (true);
create policy "anon_delete_ii_9" on public.ii_9 for delete to anon using (true);

create table public.iii_1 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.iii_1 enable row level security;
create policy "anon_select_iii_1" on public.iii_1 for select to anon using (true);
create policy "anon_insert_iii_1" on public.iii_1 for insert to anon with check (true);
create policy "anon_update_iii_1" on public.iii_1 for update to anon using (true) with check (true);
create policy "anon_delete_iii_1" on public.iii_1 for delete to anon using (true);

create table public.iii_2 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.iii_2 enable row level security;
create policy "anon_select_iii_2" on public.iii_2 for select to anon using (true);
create policy "anon_insert_iii_2" on public.iii_2 for insert to anon with check (true);
create policy "anon_update_iii_2" on public.iii_2 for update to anon using (true) with check (true);
create policy "anon_delete_iii_2" on public.iii_2 for delete to anon using (true);

create table public.iii_3 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.iii_3 enable row level security;
create policy "anon_select_iii_3" on public.iii_3 for select to anon using (true);
create policy "anon_insert_iii_3" on public.iii_3 for insert to anon with check (true);
create policy "anon_update_iii_3" on public.iii_3 for update to anon using (true) with check (true);
create policy "anon_delete_iii_3" on public.iii_3 for delete to anon using (true);

create table public.iv_1 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.iv_1 enable row level security;
create policy "anon_select_iv_1" on public.iv_1 for select to anon using (true);
create policy "anon_insert_iv_1" on public.iv_1 for insert to anon with check (true);
create policy "anon_update_iv_1" on public.iv_1 for update to anon using (true) with check (true);
create policy "anon_delete_iv_1" on public.iv_1 for delete to anon using (true);

create table public.iv_2 (
  tt text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.iv_2 enable row level security;
create policy "anon_select_iv_2" on public.iv_2 for select to anon using (true);
create policy "anon_insert_iv_2" on public.iv_2 for insert to anon with check (true);
create policy "anon_update_iv_2" on public.iv_2 for update to anon using (true) with check (true);
create policy "anon_delete_iv_2" on public.iv_2 for delete to anon using (true);

-- BC định kỳ (logical: BC định kỳ)
create table public.bc_dinh_ky (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.bc_dinh_ky enable row level security;
create policy "anon_select_bc_dinh_ky" on public.bc_dinh_ky for select to anon using (true);
create policy "anon_insert_bc_dinh_ky" on public.bc_dinh_ky for insert to anon with check (true);
create policy "anon_update_bc_dinh_ky" on public.bc_dinh_ky for update to anon using (true) with check (true);
create policy "anon_delete_bc_dinh_ky" on public.bc_dinh_ky for delete to anon using (true);

-- Làm mới cache API sau khi tạo bảng (tránh lỗi "schema cache")
notify pgrst, 'reload schema';
