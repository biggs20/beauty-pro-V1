import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zomtwedwownbtijiwwrp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvbXR3ZWR3b3duYnRpaml3d3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0MjgxNzYsImV4cCI6MjA1MTAwNDE3Nn0.iSkTDnJyuwNMVBqvUuGwz1nJGC7I6IkpXVCJ9xZBmX0'

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}
