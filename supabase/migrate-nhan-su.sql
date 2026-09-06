-- Thêm bảng nhân sự (chạy nếu project đã có schema cũ, không cần drop toàn bộ)
-- Supabase → SQL Editor → Run
--
-- Dữ liệu nghiệp vụ nằm trong data (jsonb), ví dụ:
--   name / Họ tên, department / Phòng ban, position / Chức vụ,
--   email, phone / SĐT, status / Trạng thái, joinDate / Ngày vào làm

create table if not exists public.nhan_su (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.nhan_su enable row level security;
drop policy if exists "anon_select_nhan_su" on public.nhan_su;
drop policy if exists "anon_insert_nhan_su" on public.nhan_su;
drop policy if exists "anon_update_nhan_su" on public.nhan_su;
drop policy if exists "anon_delete_nhan_su" on public.nhan_su;
create policy "anon_select_nhan_su" on public.nhan_su for select to anon using (true);
create policy "anon_insert_nhan_su" on public.nhan_su for insert to anon with check (true);
create policy "anon_update_nhan_su" on public.nhan_su for update to anon using (true) with check (true);
create policy "anon_delete_nhan_su" on public.nhan_su for delete to anon using (true);

notify pgrst, 'reload schema';
