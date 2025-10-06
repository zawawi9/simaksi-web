// Config file for Supabase connection
const supabaseUrl = 'https://kitxtcpfnccblznbagzx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpdHh0Y3BmbmNjYmx6bmJhZ3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1ODIxMzEsImV4cCI6MjA3NTE1ODEzMX0.OySigpw4AWI3G7JW_8r8yXu7re0Mr9CYv8u3d9Fr548';//kuncianon

// Create the Supabase client
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Export the supabase client for module imports
export { supabase };