// lib/supabase/client.ts
// Minimal Supabase client shim — replace with full implementation/config in secure code path.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// TODO: Replace this stub with the project's canonical supabase client implementation
export const supabase = createClient(url, key);
export default supabase;
