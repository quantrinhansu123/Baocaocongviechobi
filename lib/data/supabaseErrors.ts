export function throwSupabaseError(message: string, table: string): never {
  if (
    message.includes('schema cache') ||
    message.includes('Could not find the table') ||
    message.includes('does not exist')
  ) {
    throw new Error(
      `Bảng public.${table} chưa đúng trên Supabase. ` +
        'Mở Supabase → SQL Editor → chạy toàn bộ file supabase/schema.sql → Run, rồi npm run db:check.'
    );
  }
  throw new Error(message);
}
