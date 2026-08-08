-- Đồng bộ trường TIẾN ĐỘ CV (%) vào Supabase
-- App ghi/đọc key "TIẾN ĐỘ CV" trong cột data (jsonb) của bảng công việc.
-- Không cần ALTER TABLE (schema dùng jsonb linh hoạt).
--
-- Cách chạy:
-- 1) Supabase Dashboard → SQL Editor → New query
-- 2) Dán toàn bộ file này → Run
--
-- Sau khi chạy: tạo/sửa CV trên app với "% Tiến độ CV" rồi Lưu → kiểm tra
-- Table Editor → bảng i_1 (hoặc phòng ban tương ứng) → cột data có "TIẾN ĐỘ CV".

-- Gán mặc định 0 cho bản ghi chưa có key (an toàn, idempotent)
do $$
declare
  t text;
  tables text[] := array[
    'i_1','i_2','i_3',
    'ii_1','ii_2','ii_3','ii_4','ii_5','ii_6','ii_7','ii_8','ii_9',
    'iii_1','iii_2','iii_3',
    'iv_1','iv_2'
  ];
begin
  foreach t in array tables loop
    execute format(
      $sql$
        update public.%I
        set
          data = jsonb_set(coalesce(data, '{}'::jsonb), '{TIẾN ĐỘ CV}', '0', true),
          updated_at = now()
        where not (coalesce(data, '{}'::jsonb) ? 'TIẾN ĐỘ CV');
      $sql$,
      t
    );
  end loop;
end $$;

notify pgrst, 'reload schema';
