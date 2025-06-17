// lib/cache-service.ts
/**
 * Cache Management Service
 * Handles cache invalidation when data is updated through admin console
 */

const CLOUDFLARE_WORKER_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cool-base-7f83.trachea03troves.workers.dev';
const NEXT_PUBLIC_ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN; // Add this to your .env

interface CacheResponse {
  success: boolean;
  message: string;
  cleared_keys?: string[];
}

export class CacheService {
  /**
   * Clear ALL cache (nuclear option)
   */
  static async clearAllCache(): Promise<CacheResponse> {
    try {
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'all',
          adminToken: NEXT_PUBLIC_ADMIN_TOKEN
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error clearing all cache:', error);
      throw error;
    }
  }

  /**
   * Clear harbor cache for all languages
   */
  static async clearHarborCache(): Promise<CacheResponse> {
    try {
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'harbors',
          adminToken: NEXT_PUBLIC_ADMIN_TOKEN
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error clearing harbor cache:', error);
      throw error;
    }
  }

  /**
   * Clear trivia cache for all languages
   */
  static async clearTriviaCache(): Promise<CacheResponse> {
    try {
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'trivia',
          adminToken: NEXT_PUBLIC_ADMIN_TOKEN
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error clearing trivia cache:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific language
   */
  static async clearCacheForLanguage(type: 'harbors' | 'trivia', language: string): Promise<CacheResponse> {
    try {
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/cache/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          language,
          adminToken: NEXT_PUBLIC_ADMIN_TOKEN
        })
      });

      return await response.json();
    } catch (error) {
      console.error(`Error clearing ${type} cache for ${language}:`, error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats() {
    try {
      const response = await fetch(`${CLOUDFLARE_WORKER_URL}/cache/stats`);
      return await response.json();
    } catch (error) {
      console.error('Error getting cache stats:', error);
      throw error;
    }
  }

  /**
   * Force cache refresh by clearing and warming up
   */
  static async refreshCache(type: 'harbors' | 'trivia'): Promise<void> {
    try {
      // Clear the cache first
      if (type === 'harbors') {
        await this.clearHarborCache();
      } else {
        await this.clearTriviaCache();
      }

      // Warm up cache by making requests for each language
      const languages = ['fi', 'en', 'sv'];
      
      for (const lang of languages) {
        try {
          await fetch(`${CLOUDFLARE_WORKER_URL}/${type}?lang=${lang}`);
        } catch (error) {
          console.warn(`Failed to warm cache for ${type}:${lang}`, error);
        }
      }
    } catch (error) {
      console.error(`Error refreshing ${type} cache:`, error);
      throw error;
    }
  }
}

// Hook for React components
export function useCacheManagement() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const clearCache = async (type: 'all' | 'harbors' | 'trivia') => {
    setLoading(true);
    try {
      let result;
      switch (type) {
        case 'all':
          result = await CacheService.clearAllCache();
          break;
        case 'harbors':
          result = await CacheService.clearHarborCache();
          break;
        case 'trivia':
          result = await CacheService.clearTriviaCache();
          break;
      }
      
      // Refresh stats after clearing
      await refreshStats();
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  const refreshCache = async (type: 'harbors' | 'trivia') => {
    setLoading(true);
    try {
      await CacheService.refreshCache(type);
      await refreshStats();
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      const cacheStats = await CacheService.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Error refreshing cache stats:', error);
    }
  };

  return {
    loading,
    stats,
    clearCache,
    refreshCache,
    refreshStats
  };
}