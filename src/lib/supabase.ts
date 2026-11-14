import { createClient } from '@supabase/supabase-js';

// Public client config. The anon key is meant to ship to browsers; the Gemini and
// service-role keys live only in the edge function's environment.
export const projectId = 'ohgumjbsjbcbbtbwpnfz';
export const publicAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oZ3VtamJzamJjYmJ0YndwbmZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTU0OTMsImV4cCI6MjA5Mjc5MTQ5M30.MqJJAT0HtE_IqfGurtvwhMwIDMWUIp_bTGGad-x4B5I';

/** Base URL of the WhereTwo edge function (supabase/functions/server). */
export const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-9b7ec865`;

export const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

/** Headers for an edge-function call. Pass the user's access token, or the anon key for public routes. */
export const authHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});
