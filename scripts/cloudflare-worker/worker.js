// scripts/cloudflare-worker/worker.js
/**
 * Harbor API Worker - Platform Agnostic Design
 * Can be migrated to Vercel, AWS, or any platform later
 */

export default {
  async fetch(request, env, ctx) {
    // CORS headers for browser compatibility
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // Route: Get harbors
      if (request.method === 'GET' && url.pathname === '/harbors') {
        return await getHarbors(url.searchParams.get('lang') || 'fi', env, corsHeaders);
      }

      // Route: Get trivia
      if (request.method === 'GET' && url.pathname === '/trivia') {
        return await getTrivia(url.searchParams.get('lang') || 'fi', env, corsHeaders);
      }

      // Route: Upload image
      if (request.method === 'POST' && url.pathname === '/upload-image') {
        return await uploadImage(request, env, corsHeaders);
      }

      // Route: Health check
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Default response
      return new Response(JSON.stringify({
        message: 'Harbor API v1.0.0',
        endpoints: ['/harbors', '/trivia', '/upload-image', '/health']
      }), {
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

// Harbor data fetching (easily portable to other platforms)
async function getHarbors(language, env, corsHeaders) {
  try {
    // First get harbors
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

    // Then get all hints for this language
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

    // Add hints to each harbor
    const harborsWithHints = harbors.map(harbor => ({
      ...harbor,
      hints: (hintsByHarbor[harbor.id] || [])
        .sort((a, b) => a.hint_order - b.hint_order)
        .map(hint => hint.hint_text)
    }));

    console.log(`Fetched ${harborsWithHints.length} harbors with hints for ${language}`);
    console.log(`First harbor hints:`, harborsWithHints[0]?.hints);
    
    return new Response(JSON.stringify(harborsWithHints), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // 1 hour cache
      }
    });
  } catch (error) {
    console.error('Harbor fetch error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch harbors',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Trivia data fetching  
async function getTrivia(language, env, corsHeaders) {
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
    
    return new Response(JSON.stringify(trivia), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch trivia',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Image upload to R2 (easily replaceable with S3, Storj, etc.)
async function uploadImage(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP allowed.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `harbor-${timestamp}-${randomString}.${extension}`;

    // Upload to R2 (this part would change for different storage providers)
    await env.HARBOR_IMAGES.put(filename, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    // Return public URL (this would change for different storage providers)
    const imageUrl = `https://pub-40af20c56eb7480285252a2f5d11ea7d.r2.dev/${filename}`;

    return new Response(JSON.stringify({
      success: true,
      url: imageUrl,
      filename: filename,
      size: file.size,
      type: file.type
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Upload failed',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}