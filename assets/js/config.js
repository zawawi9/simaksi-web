// Config file for Supabase connection
const supabaseUrl = 'URL_PROYEK_ANDA_DISINI';
const supabaseKey = 'KUNCI_ANON_ANDA_DISINI';

// Create the Supabase client
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Export the supabase client for module imports
export { supabase };