import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://yeeyuopqlzwxjijsqniw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZXl1b3BxbHp3eGppanNxbml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1OTMyMzgsImV4cCI6MjEwMDE2OTIzOH0.vKHwafPXWVv3aSkJJiY-eQJFPF_WWOFamJzGVssQVeA";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
