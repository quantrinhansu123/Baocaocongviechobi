export function formatSupabaseConnectError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const cause =
    error instanceof Error && error.cause instanceof Error
      ? `${error.cause.message} ${'code' in error.cause ? String((error.cause as { code?: string }).code ?? '') : ''}`
      : '';
  const blob = `${message} ${cause}`;

  if (
    blob.includes('ENOTFOUND') ||
    blob.includes('ECONNREFUSED') ||
    blob.includes('fetch failed') ||
    blob.includes('getaddrinfo')
  ) {
    return (
      'Không kết nối được Supabase (DNS/mạng). ' +
      'Project trong .env có thể đã xóa/pause hoặc URL sai. ' +
      'Cập nhật SUPABASE_URL + SUPABASE_ANON_KEY (project mới), chạy supabase/schema.sql, rồi restart npm run dev.'
    );
  }

  return message || 'Không thể kết nối Supabase.';
}

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
  throw new Error(formatSupabaseConnectError(new Error(message)));
}
