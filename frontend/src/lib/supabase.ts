import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://skvdpkidxoidlcurujup.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdmRwa2lkeG9pZGxjdXJ1anVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTg5NDYsImV4cCI6MjEwMzgzNDk0Nn0.N60y52ALURfbNIieDzgDcLiff-kNd2y54Q8_NRtgy00";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
