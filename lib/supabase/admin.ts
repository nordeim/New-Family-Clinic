// lib/supabase/admin.ts
// Minimal Supabase admin client shim used to satisfy imports during build.
// Replace with your canonical admin client implementation that uses the service role key.
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_ROLE ??
  process.env.SUPABASE_ANON_KEY ??
  "";

if (!url || !key) {
  // Non-fatal at build time; will surface runtime issues if env is not configured.
  // Keep this as a temporary shim if you don't have the canonical implementation restored yet.
  // TODO: Replace with project canonical admin client and ensure secrets come from secure store.
  // eslint-disable-next-line no-console
  console.warn("lib/supabase/admin: created client with empty URL or key — set env vars in runtime.");
}

export const createSupabaseAdminClient = () => createClient(url, key);
export const supabaseAdmin = createClient(url, key);
export default supabaseAdmin;

