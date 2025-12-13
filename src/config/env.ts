import Constants from 'expo-constants';

interface Environment {
  OPENAI_API_KEY: string;
  OPENAI_API_BASE_URL: string;
  OPENAI_MODEL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: string;
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: string;
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
  EXPO_PUBLIC_API_URL: string;
}

const getEnvVars = (): Environment => {
  const extra = Constants.expoConfig?.extra || {};

  return {
    OPENAI_API_KEY: extra.OPENAI_API_KEY || '',
    OPENAI_API_BASE_URL: extra.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    OPENAI_MODEL: extra.OPENAI_MODEL || 'gpt-4o-mini',
    SUPABASE_URL: extra.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: extra.SUPABASE_ANON_KEY || '',
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: extra.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: extra.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    EXPO_PUBLIC_API_URL: extra.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000',
  };
};

export const ENV = getEnvVars();

export const isApiConfigured = (): boolean => {
  return !!ENV.OPENAI_API_KEY;
};
