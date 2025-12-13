import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { ENV } from '@/config/env';

// Replace with your actual Supabase URL and Anon Key or configured via .env files/app.json
const supabaseUrl = ENV.SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY || 'tu-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
