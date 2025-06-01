// Environment variables configuration
// This file provides a centralized way to access environment variables

/**
 * Get an environment variable value
 * @param key The environment variable key
 * @param defaultValue Optional default value if the environment variable is not set
 * @returns The environment variable value or the default value
 */
export function getEnvVariable(key: string, defaultValue: string = ''): string {
  // For client-side code, use the next.js public env variables (NEXT_PUBLIC_*)
  if (typeof window !== 'undefined') {
    return (process.env[`NEXT_PUBLIC_${key}`] || defaultValue) as string;
  }
  
  // For server-side code, use the regular env variables
  return (process.env[key] || defaultValue) as string;
}

// Google AI Studio API key
// In production, this should be set as an environment variable
// For development, we're using a hardcoded value for demonstration purposes
export const GOOGLE_AI_STUDIO_API_KEY = 
  getEnvVariable('GOOGLE_AI_STUDIO_API_KEY', 'AIzaSyAvt0fWFDEjyCmjMueE-Y1ncIq6yg_GVyM');

// Supabase configuration
// For development, we're using demo values - replace with your own in production
export const SUPABASE_URL = 
  getEnvVariable('SUPABASE_URL', 'https://xyzcompany.supabase.co');

export const SUPABASE_ANON_KEY = 
  getEnvVariable('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtdHBrd3Fzc2ZqaWZyZXRnbWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODUxMjI2MDgsImV4cCI6MjAwMDY5ODYwOH0.demo_key');
