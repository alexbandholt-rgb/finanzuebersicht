import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://zgqfoztgzdesamzgpwdk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpncWZvenRnemRlc2Ftemdwd2RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0ODA5NDYsImV4cCI6MjA5ODA1Njk0Nn0.9DlMHOLZDym4OyJ9hKZKc8STmBiHZWJGQ34-EQepiyk'
)
