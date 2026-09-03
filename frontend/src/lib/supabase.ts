import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://aluzqooagiymysssnhkg.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdXpxb29hZ2l5bXlzc3NuaGtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNzY2MDgsImV4cCI6MjEwMzk1MjYwOH0.lXP2dKg93qvi_BL51UUwJrNctDP3VM8zImJ_BkjMMpc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
