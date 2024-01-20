import { createClient } from "@supabase/supabase-js";

export const SUPABASE_AUTH_EMAIL = 'clbb8.mail@gmail.com'
export const SUPABASE_AUTH_PASSWORD = "Bryanbrady1"
const SUPABASE_URL = "https://lkxwausyseuiizopsrwi.supabase.co";

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxreHdhdXN5c2V1aWl6b3BzcndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQ2Nzg0MDQsImV4cCI6MjAyMDI1NDQwNH0.qRzHq2F1qqky8Q-CoFdkr6VBFm48ra3aRo6oZu4vvnQ"

export const supabase = createClient(SUPABASE_URL, ANON_KEY);

