import { createBrowserClient } from "@supabase/ssr";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kvzazejryyoikloqhtbm.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2emF6ZWpyeXlvaWtsb3FodGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxODE4NjYsImV4cCI6MjEwNDc1Nzg2Nn0.moNmGgxzbdf891mImHKp1EHwFKz6-8sc2_3KY94hOcI";

export const isSupabaseConfigured = () => true;

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
