// scripts/cloudflare-worker/worker.js
/**
 * Harbor API Worker - Production Grade Configurable
 * All values configurable via environment variables
 * Now includes image deletion with automatic cache clearing
 */

// Cache configuration
const CACHE_VERSION = 'v1';
const CACHE_TTL = 31536000; // 1 year in seconds

// Helper function to generate cache keys
const getCacheKey = (type, language) => `${CACHE_VERSION}:${type}:${language}`;

export default {
  async fetch(request, env, ctx) {
    // CORS headers for browser compatibility
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // ROUTE: Get harbors with caching
      if (request.method === 'GET' && url.pathname === '/harbors') {
        return await getHarborsWithCache(url.searchParams.get('lang') || 'fi', env, corsHeaders);
      }

      // ROUTE: Get trivia with caching  
      if (request.method === 'GET' && url.pathname === '/trivia') {
        return await getTriviaWithCache(url.searchParams.get('lang') || 'fi', env, corsHeaders);
      }

      // ROUTE: Upload image (admin only)
      if (request.method === 'POST' && url.pathname === '/upload-image') {
        return await uploadImage(request, env, corsHeaders);
      }

      // ROUTE: Delete image (admin only) - NEW!
      if (request.method === 'DELETE' && url.pathname === '/delete-image') {
        return await deleteImage(request, env, corsHeaders);
      }

      // ROUTE: Clear cache (admin only)
      if (request.method === 'POST' && url.pathname === '/cache/clear') {
        return await clearCache(request, env, corsHeaders);
      }

      // ROUTE: Cache statistics
      if (request.method === 'GET' && url.pathname === '/cache/stats') {
        return await getCacheStats(env, corsHeaders);
      }

      // ROUTE: Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          version: '1.1.0',
          cache: 'enabled',
          auth: 'supabase-jwt-configurable',
          security: 'metadata-based-admin',
          features: ['upload', 'delete', 'cache-clear']
        }), {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
      }

      // ROUTE: Root info
      if (url.pathname === '/') {
        return new Response(JSON.stringify({
          name: 'Harbor API Worker',
          version: '1.1.0',
          endpoints: {
            'GET /harbors?lang=fi': 'Get harbors with caching',
            'GET /trivia?lang=fi': 'Get trivia with caching',
            'POST /upload-image': 'Upload image (admin)',
            'DELETE /delete-image': 'Delete image (admin)',
            'POST /cache/clear': 'Clear cache (admin)',
            'GET /cache/stats': 'Cache statistics',
            'GET /health': 'Health check'
          },
          cache: 'KV-based with 1 year TTL',
          auth: 'Supabase JWT with configurable admin verification'
        }), {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
      }

      // Default 404 response
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: `Endpoint ${url.pathname} not found`,
        available_endpoints: ['/harbors', '/trivia', '/upload-image', '/delete-image', '/cache/clear', '/cache/stats', '/health']
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Configurable admin access verification
 * 
 * @param {string} supabaseToken - JWT token from user session
 * @param {string} userId - User ID to verify
 * @param {object} env - Environment variables
 * @returns {boolean} - Whether user has admin access
 */
async function verifyAdminAccess(supabaseToken, userId, env) {
  try {
    console.log(`🔐 Verifying admin access for user: ${userId}`);

    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase environment variables');
      return false;
    }

    // Method 1: Try Supabase Auth API first
    try {
      const authResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${supabaseToken}`,
          'apikey': env.SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });

      console.log(`🔐 Auth API response status: ${authResponse.status}`);

      if (authResponse.ok) {
        const authData = await authResponse.json();
        
        // The Auth API returns user data directly, not wrapped in a 'user' object
        if (authData && authData.id === userId) {
          // Check for admin role in session metadata
          const hasAdmin = authData.raw_user_meta_data?.role === 'admin' ||
                           authData.user_metadata?.role === 'admin';
          
          console.log(`🔍 Found admin role: ${hasAdmin} (raw: ${authData.raw_user_meta_data?.role}, user: ${authData.user_metadata?.role})`);
          
          if (hasAdmin) {
            console.log('✅ Admin verified via Auth API');
            return true;
          }
        } else {
          console.log(`❌ User ID mismatch: expected ${userId}, got ${authData?.id}`);
        }
      }
    } catch (authError) {
      console.log('⚠️ Auth API failed, trying database fallback:', authError.message);
    }

    // Method 2: Direct database check as fallback
    console.log('🔄 Checking database directly...');
    
    const dbResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/check_user_admin`, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id_param: userId })
    });

    if (dbResponse.ok) {
      const isAdmin = await dbResponse.json();
      console.log(`🔍 Database check result: ${isAdmin}`);
      
      if (isAdmin) {
        console.log('✅ Admin verified via database');
        return true;
      }
    } else {
      console.error(`❌ Database check failed: ${dbResponse.status}`);
    }

    // No hardcoded emergency admin access - rely on database only

    console.log('❌ Admin verification failed - no method succeeded');
    return false;

  } catch (error) {
    console.error('❌ Error during admin verification:', error);
    return false;
  }
}

/**
 * Clear ALL cache for all harbors after image changes
 */
async function clearAllHarborCache(env) {
  try {
    console.log('🗑️ Clearing all harbor cache after image change...');
    
    const languages = ['fi', 'en', 'sv'];
    const clearedKeys = [];
    
    // Clear harbor cache for all languages
    for (const lang of languages) {
      const key = getCacheKey('harbors', lang);
      await env.HARBOR_CACHE.delete(key);
      clearedKeys.push(key);
      console.log(`🗑️ Cleared cache key: ${key}`);
    }
    
    console.log(`✅ Cleared ${clearedKeys.length} harbor cache keys`);
    return clearedKeys;
    
  } catch (error) {
    console.error('❌ Error clearing harbor cache:', error);
    throw error;
  }
}

/**
 * Get harbors with KV caching
 */
async function getHarborsWithCache(language, env, corsHeaders) {
  const cacheKey = getCacheKey('harbors', language);
  
  try {
    // Try cache first
    const cachedData = await env.HARBOR_CACHE.get(cacheKey);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return new Response(JSON.stringify(parsedData), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        }
      });
    }

    // Cache miss - fetch from database
    const harborsData = await getHarborsFromDatabase(language, env);
    
    // Store in cache
    await env.HARBOR_CACHE.put(cacheKey, JSON.stringify(harborsData), {
      expirationTtl: CACHE_TTL,
    });

    return new Response(JSON.stringify(harborsData), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Cache': 'MISS'
      }
    });

  } catch (error) {
    console.error('Error in getHarborsWithCache:', error);
    throw error;
  }
}

/**
 * Get trivia with KV caching
 */
async function getTriviaWithCache(language, env, corsHeaders) {
  const cacheKey = getCacheKey('trivia', language);
  
  try {
    // Try cache first
    const cachedData = await env.HARBOR_CACHE.get(cacheKey);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      return new Response(JSON.stringify(parsedData), {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        }
      });
    }

    // Cache miss - fetch from database
    const triviaData = await getTriviaFromDatabase(language, env);
    
    // Store in cache
    await env.HARBOR_CACHE.put(cacheKey, JSON.stringify(triviaData), {
      expirationTtl: CACHE_TTL,
    });

    return new Response(JSON.stringify(triviaData), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Cache': 'MISS'
      }
    });

  } catch (error) {
    console.error('Error in getTriviaWithCache:', error);
    throw error;
  }
}

/**
 * Harbor data fetching from Supabase
 */
async function getHarborsFromDatabase(language, env) {
  try {
    // Get harbors
    const harborsResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/harbors?language=eq.${language}&select=*&order=view_count.asc`, {
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!harborsResponse.ok) {
      throw new Error(`Database error: ${harborsResponse.status}`);
    }

    const harbors = await harborsResponse.json();

    // Get hints
    const hintsResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/harbor_hints?language=eq.${language}&select=*&order=harbor_id,hint_order`, {
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!hintsResponse.ok) {
      throw new Error(`Hints fetch error: ${hintsResponse.status}`);
    }

    const hints = await hintsResponse.json();

    // Group hints by harbor_id
    const hintsByHarbor = {};
    hints.forEach(hint => {
      if (!hintsByHarbor[hint.harbor_id]) {
        hintsByHarbor[hint.harbor_id] = [];
      }
      hintsByHarbor[hint.harbor_id].push(hint);
    });

    // Add hints to harbors
    const harborsWithHints = harbors.map(harbor => ({
      ...harbor,
      hints: (hintsByHarbor[harbor.id] || [])
        .sort((a, b) => a.hint_order - b.hint_order)
        .map(hint => hint.hint_text)
    }));

    return harborsWithHints;

  } catch (error) {
    console.error('Harbor database fetch error:', error);
    throw new Error(`Failed to fetch harbors: ${error.message}`);
  }
}

/**
 * Trivia data fetching from Supabase
 */
async function getTriviaFromDatabase(language, env) {
  try {
    const response = await fetch(`${env.SUPABASE_URL}/rest/v1/trivia_questions?language=eq.${language}&select=*`, {
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Database error: ${response.status}`);
    }

    const trivia = await response.json();
    return trivia;

  } catch (error) {
    console.error('Trivia database fetch error:', error);
    throw new Error(`Failed to fetch trivia: ${error.message}`);
  }
}

/**
 * Cache clearing endpoint with robust admin verification
 */
async function clearCache(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { type, language, supabaseToken, userId } = body;

    // Validate required fields
    if (!supabaseToken || !userId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        message: 'supabaseToken and userId are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use configurable admin verification
    const isAdmin = await verifyAdminAccess(supabaseToken, userId, env);
    
    if (!isAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Admin access required. User not authorized.',
        user_id: userId
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const clearedKeys = [];

    if (type === 'all') {
      // Clear all cache entries
      const languages = ['fi', 'en', 'sv'];
      const types = ['harbors', 'trivia'];
      
      for (const lang of languages) {
        for (const dataType of types) {
          const key = getCacheKey(dataType, lang);
          await env.HARBOR_CACHE.delete(key);
          clearedKeys.push(key);
        }
      }
    } else if (type && language) {
      // Clear specific type and language
      const key = getCacheKey(type, language);
      await env.HARBOR_CACHE.delete(key);
      clearedKeys.push(key);
    } else if (type) {
      // Clear all languages for a specific type
      const languages = ['fi', 'en', 'sv'];
      for (const lang of languages) {
        const key = getCacheKey(type, lang);
        await env.HARBOR_CACHE.delete(key);
        clearedKeys.push(key);
      }
    } else {
      return new Response(JSON.stringify({ 
        error: 'Invalid request', 
        message: 'Specify type=all, or type with optional language'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`🗑️ Cache cleared by user ${userId}: ${clearedKeys.join(', ')}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Cache cleared successfully',
      cleared_keys: clearedKeys,
      cleared_by: userId,
      admin_verified: true,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    return new Response(JSON.stringify({
      error: 'Failed to clear cache',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Cache statistics endpoint
 */
async function getCacheStats(env, corsHeaders) {
  try {
    const stats = {
      cache_version: CACHE_VERSION,
      cache_ttl: CACHE_TTL,
      auth_type: 'supabase-jwt-configurable',
      security: 'metadata-based-admin',
      timestamp: new Date().toISOString(),
      keys: {}
    };

    // Check which cache keys exist
    const languages = ['fi', 'en', 'sv'];
    const types = ['harbors', 'trivia'];
    
    for (const lang of languages) {
      for (const type of types) {
        const key = getCacheKey(type, lang);
        const data = await env.HARBOR_CACHE.get(key);
        stats.keys[key] = {
          exists: !!data,
          size_bytes: data ? data.length : 0,
          items_count: data ? JSON.parse(data).length : 0
        };
      }
    }

    return new Response(JSON.stringify(stats, null, 2), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error getting cache stats:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get cache stats',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Image upload to R2 with configurable URL and automatic cache clearing
 */
async function uploadImage(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const supabaseToken = formData.get('supabaseToken');
    const userId = formData.get('userId');

    if (!supabaseToken || !userId) {
      return new Response(JSON.stringify({ 
        error: 'Missing authentication'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use configurable admin verification
    const isAdmin = await verifyAdminAccess(supabaseToken, userId, env);
    
    if (!isAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Admin access required for image upload'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate R2 configuration
    if (!env.R2_PUBLIC_URL) {
      return new Response(JSON.stringify({ 
        error: 'R2 configuration missing',
        message: 'R2_PUBLIC_URL environment variable required'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `harbor-${timestamp}-${randomString}.${extension}`;

    // Upload to R2
    await env.HARBOR_IMAGES.put(filename, file.stream(), {
      httpMetadata: { 
        contentType: file.type,
        cacheControl: 'public, max-age=31536000'
      }
    });

    // Use configurable public URL
    const imageUrl = `${env.R2_PUBLIC_URL}/${filename}`;

    // Clear harbor cache since images affect harbor data
    try {
      const clearedKeys = await clearAllHarborCache(env);
      console.log(`✅ Auto-cleared harbor cache after image upload: ${clearedKeys.length} keys`);
    } catch (cacheError) {
      console.error('⚠️ Failed to clear cache after upload (continuing anyway):', cacheError);
    }

    return new Response(JSON.stringify({
      success: true,
      url: imageUrl,
      filename: filename,
      size: file.size,
      type: file.type,
      uploaded_by: userId,
      cache_cleared: true,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Upload failed',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Delete image from R2 with configurable admin verification and automatic cache clearing
 */
async function deleteImage(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { imageUrl, supabaseToken, userId } = body;

    console.log('🗑️ Delete image request received:', { imageUrl, userId });

    // Validate required fields
    if (!supabaseToken || !userId) {
      return new Response(JSON.stringify({ 
        error: 'Missing authentication',
        message: 'supabaseToken and userId are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!imageUrl) {
      return new Response(JSON.stringify({ 
        error: 'Missing imageUrl',
        message: 'imageUrl is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use configurable admin verification (same as upload)
    const isAdmin = await verifyAdminAccess(supabaseToken, userId, env);
    
    if (!isAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Admin access required for image deletion'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract filename from the R2 URL
    // Expected format: https://pub-40af20c56eb7480285252a2f5d11ea7d.r2.dev/harbor-1751815639965-8rlgbc.jpg
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    console.log('🗑️ Extracted filename:', filename);

    // Validate filename format (security check)
    if (!filename || !filename.startsWith('harbor-') || !filename.includes('-')) {
      console.error('❌ Invalid filename format:', filename);
      return new Response(JSON.stringify({ 
        error: 'Invalid image URL',
        message: 'Image URL does not match expected format'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate R2 configuration
    if (!env.HARBOR_IMAGES) {
      return new Response(JSON.stringify({ 
        error: 'R2 configuration missing',
        message: 'HARBOR_IMAGES R2 binding not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🗑️ Attempting to delete from R2:', filename);

    // Delete from R2 bucket
    const deleteResult = await env.HARBOR_IMAGES.delete(filename);
    
    console.log('✅ R2 delete completed:', deleteResult);

    // Clear harbor cache since image deletion affects harbor data
    try {
      const clearedKeys = await clearAllHarborCache(env);
      console.log(`✅ Auto-cleared harbor cache after image deletion: ${clearedKeys.length} keys`);
    } catch (cacheError) {
      console.error('⚠️ Failed to clear cache after deletion (continuing anyway):', cacheError);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Image deleted successfully',
      filename: filename,
      originalUrl: imageUrl,
      deleted_by: userId,
      cache_cleared: true,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Image deletion error:', error);
    return new Response(JSON.stringify({ 
      error: 'Delete failed',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}