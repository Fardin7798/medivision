import { createClient } from "@supabase/supabase-js";

// No hardcoded fallback secrets: real credentials must come from
// NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).
// All live Supabase reads/writes in this app go through the FastAPI backend
// (/api/cloud/*), which is the only place that needs a Supabase client today.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
