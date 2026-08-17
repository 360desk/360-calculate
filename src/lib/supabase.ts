import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ryxspxybjmowoyodjqdk.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eHNweHliam1vd295b2RqcWRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NTQ5ODgsImV4cCI6MjEwMjUzMDk4OH0.ZwYT7tNSKN2u06DuYntOP7LK8JYgrPGAtYnzv57dGCA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);