/**
 * Simple health check endpoint - No dependencies
 * Tests if API functions work and environment variables are loaded
 */

export default function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  
  return res.status(200).json({
    status: 'API is working',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform
    },
    envCheck: {
      SUPABASE_URL: supabaseUrl 
        ? `✅ Found (${supabaseUrl.substring(0, 30)}...)` 
        : '❌ Missing',
      SUPABASE_SERVICE_KEY: supabaseKey 
        ? `✅ Found (${supabaseKey.length} characters)` 
        : '❌ Missing',
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL 
        ? '✅ Found' 
        : '❌ Missing',
      allSupabaseKeys: Object.keys(process.env)
        .filter(k => k.includes('SUPABASE'))
        .map(k => `${k}: ${process.env[k] ? '✅' : '❌'}`)
    },
    ready: !!(supabaseUrl && supabaseKey)
  });
}

