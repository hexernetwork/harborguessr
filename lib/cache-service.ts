// lib/cache-service.ts
/**
 * Cache Management Service - Pure JWT Authentication
 * Handles cache invalidation when data is updated through admin console
 */

import { supabase } from "@/lib/supabase";

const CLOUDFLARE_WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://cool-base-7f83.trachea03troves.workers.dev';

interface CacheResponse {
  success: boolean;
  message: string;
  cleared_keys?: string[];
  admin_verified?: boolean;
  auth_method?: string;
}

export class CacheService {
  /**
   * Get authenticated session for admin operations
   */
  private static async getAuthenticatedSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      throw new Error(`Session error: ${error.message}`);
    }
    
    if (!session?.access_token) {
      throw new Error('Not authenticated - please log in');
    }
    
    if (!session?.user?.id) {
      throw new Error('Invalid session - missing user ID');
    }
    
    // Debug: Log session info (without exposing sensitive token)
    console.log('🔑 Session info:', {
      userId: session.user.id,
      email: session.user.email,
      tokenPreview: session.access_token.substring(0, 20) + '...',
      hasRawUserMetaData: !!session.user.raw_user_meta_data,
      hasUserMetaData: !!session.user.user_metadata,
      adminRole: session.user.raw_user_meta_data?.role || session.user.user_metadata?.role || 'none'
    });
    
    return session;
  }

  /**
   * Make authenticated API call to worker
   */
  private static async makeAuthenticatedCall(endpoint: string, body: any): Promise<CacheResponse> {
    try {
      const session = await this.getAuthenticatedSession();
      
      console.log(`🔗 Making authenticated call to: ${CLOUDFLARE_WORKER_URL}${endpoint}`);
      
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...body,
          supabaseToken: session.access_token,
          userId: session.user.id
        })
      });

      console.log(`📡 API Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error response:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ API Success:', result);
      return result;

    } catch (error) {
      console.error('❌ API Call failed:', error);
      throw error;
    }
  }

  /**
   * Clear ALL cache (nuclear option)
   */
  static async clearAllCache(): Promise<CacheResponse> {
    try {
      console.log('🗑️ Clearing all cache...');
      return await this.makeAuthenticatedCall('/cache/clear', { type: 'all' });
    } catch (error) {
      console.error('❌ Error clearing all cache:', error);
      throw error;
    }
  }

  /**
   * Clear harbor cache for all languages
   */
  static async clearHarborCache(): Promise<CacheResponse> {
    try {
      console.log('🗑️ Clearing harbor cache...');
      return await this.makeAuthenticatedCall('/cache/clear', { type: 'harbors' });
    } catch (error) {
      console.error('❌ Error clearing harbor cache:', error);
      throw error;
    }
  }

  /**
   * Clear trivia cache for all languages
   */
  static async clearTriviaCache(): Promise<CacheResponse> {
    try {
      console.log('🗑️ Clearing trivia cache...');
      return await this.makeAuthenticatedCall('/cache/clear', { type: 'trivia' });
    } catch (error) {
      console.error('❌ Error clearing trivia cache:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific language
   */
  static async clearCacheForLanguage(type: 'harbors' | 'trivia', language: string): Promise<CacheResponse> {
    try {
      console.log(`🗑️ Clearing ${type} cache for ${language}...`);
      return await this.makeAuthenticatedCall('/cache/clear', { type, language });
    } catch (error) {
      console.error(`❌ Error clearing ${type} cache for ${language}:`, error);
      throw error;
    }
  }

  /**
   * Get cache statistics (no auth required - read-only)
   */
  static async getCacheStats() {
    try {
      console.log('📊 Fetching cache statistics...');
      
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/cache/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Cache stats retrieved:', result);
      return result;

    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      throw error;
    }
  }

  /**
   * Force cache refresh by clearing and warming up
   * This ensures immediate availability after clearing
   */
  static async refreshCache(type: 'harbors' | 'trivia'): Promise<void> {
    try {
      console.log(`🔄 Refreshing ${type} cache...`);
      
      // Clear the cache first
      if (type === 'harbors') {
        await this.clearHarborCache();
      } else {
        await this.clearTriviaCache();
      }

      // Warm up cache by making requests for each language
      const languages = ['fi', 'en', 'sv'];
      
      const warmupPromises = languages.map(async (lang) => {
        try {
          console.log(`🔥 Warming up ${type} cache for ${lang}...`);
          const response = await fetch(`${CLOUDFLARE_WORKER_URL}/${type}?lang=${lang}`);
          
          if (response.ok) {
            console.log(`✅ Cache warmed for ${type}:${lang}`);
          } else {
            console.warn(`⚠️ Failed to warm cache for ${type}:${lang}`, response.status);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to warm cache for ${type}:${lang}`, error);
        }
      });

      // Wait for all warmup requests to complete
      await Promise.all(warmupPromises);
      
      console.log(`✅ ${type} cache refresh completed`);

    } catch (error) {
      console.error(`❌ Error refreshing ${type} cache:`, error);
      throw error;
    }
  }

  /**
   * Upload image with admin authentication
   */
  static async uploadImage(file: File): Promise<any> {
    try {
      const session = await this.getAuthenticatedSession();
      
      console.log('📸 Uploading image...');
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('supabaseToken', session.access_token);
      formData.append('userId', session.user.id);

      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/upload-image`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Image uploaded successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Test admin access (useful for debugging)
   */
  static async testAdminAccess(): Promise<boolean> {
    try {
      const session = await this.getAuthenticatedSession();
      
      console.log('🧪 Testing admin access...');
      
      // Try to clear cache as an admin test
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'harbors',
          supabaseToken: session.access_token,
          userId: session.user.id
        })
      });
      
      if (response.ok) {
        console.log('✅ Admin access test passed');
        return true;
      } else {
        const errorData = await response.json();
        console.log('❌ Admin access test failed:', errorData);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Admin access test error:', error);
      return false;
    }
  }

  /**
   * Debug function to check what the worker sees
   */
  static async debugWorkerAuth(): Promise<any> {
    try {
      const session = await this.getAuthenticatedSession();
      
      console.log('🐛 Debug: Testing what worker sees...');
      
      // Test the Supabase auth endpoint directly (same as worker does)
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Auth endpoint failed: ${response.status}`);
      }

      const userData = await response.json();
      
      console.log('🐛 Debug: Auth endpoint response:', {
        userId: userData.user?.id,
        email: userData.user?.email,
        raw_user_meta_data: userData.user?.raw_user_meta_data,
        user_metadata: userData.user?.user_metadata,
        raw_app_meta_data: userData.user?.raw_app_meta_data,
        app_metadata: userData.user?.app_metadata
      });

      return userData;

    } catch (error) {
      console.error('🐛 Debug: Auth test failed:', error);
      throw error;
    }
  }
}