import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadSupabaseConfig } from './supabaseConfig';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const config = loadSupabaseConfig();
    client = createClient(config.url, config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}
