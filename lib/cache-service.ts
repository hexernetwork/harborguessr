// lib/cache-service.ts
import { supabase } from "@/lib/supabase";

const WORKER_BASE_URL = process.env.NEXT_PUBLIC_WORKER_URL;

interface CacheStats {
  cache_version: string;
  cache_ttl: number;
  timestamp: string;
  keys: Record<string, {
    exists: boolean;
    size_bytes: number;
    items_count: number;
  }>;
}

export class CacheService {
  static async getCacheStats(): Promise<CacheStats> {
    if (!WORKER_BASE_URL) {
      throw new Error('NEXT_PUBLIC_WORKER_URL not configured');
    }

    console.log('📡 Fetching cache stats...');
    const response = await fetch(`${WORKER_BASE_URL}/cache/stats`);
    if (!response.ok) {
      console.error(`❌ Failed to get cache stats: HTTP ${response.status}`);
      throw new Error(`Failed to get cache stats: HTTP ${response.status}`);
    }

    const stats = await response.json();
    console.log('✅ Cache stats fetched:', stats);
    return stats;
  }

  static async smartRefreshCache(type: 'harbors' | 'trivia' | 'all' = 'all'): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    if (!WORKER_BASE_URL) {
      throw new Error('NEXT_PUBLIC_WORKER_URL not configured');
    }

    console.log(`🔄 Smart refreshing ${type} cache...`);

    // Step 1: Clear old cache
    const clearResponse = await fetch(`${WORKER_BASE_URL}/cache/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: type,
        supabaseToken: session.access_token,
        userId: session.user.id
      })
    });

    if (!clearResponse.ok) {
      console.error(`❌ Failed to clear cache: HTTP ${clearResponse.status}`);
      throw new Error(`Failed to clear cache: HTTP ${clearResponse.status}`);
    }

    const clearResult = await clearResponse.json();
    console.log(`✅ Cache cleared for ${type}:`, clearResult);

    // Step 2: Immediately fetch fresh data to repopulate cache
    if (type === 'harbors' || type === 'all') {
      console.log('🔄 Repopulating harbor cache...');
      const languages = ['fi', 'en', 'sv'];
      
      await Promise.all(languages.map(async (lang) => {
        try {
          console.log(`📡 Fetching harbors for ${lang}...`);
          const response = await fetch(`${WORKER_BASE_URL}/harbors?lang=${lang}`);
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Repopulated ${lang} harbors: ${data.length} items`);
          } else {
            console.warn(`⚠️ Failed to repopulate ${lang} harbors: HTTP ${response.status}`);
          }
        } catch (error) {
          console.warn(`⚠️ Error repopulating ${lang} harbors:`, error);
        }
      }));
    }

    if (type === 'trivia' || type === 'all') {
      console.log('🔄 Repopulating trivia cache...');
      const languages = ['fi', 'en', 'sv'];
      
      await Promise.all(languages.map(async (lang) => {
        try {
          console.log(`📡 Fetching trivia for ${lang}...`);
          const response = await fetch(`${WORKER_BASE_URL}/trivia?lang=${lang}`);
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Repopulated ${lang} trivia: ${data.length} items`);
          } else {
            console.warn(`⚠️ Failed to repopulate ${lang} trivia: HTTP ${response.status}`);
          }
        } catch (error) {
          console.warn(`⚠️ Error repopulating ${lang} trivia:`, error);
        }
      }));
    }

    console.log(`🎉 Smart refresh completed for ${type}`);
    return {
      ...clearResult,
      smart_refresh: true,
      repopulated: true,
      timestamp: new Date().toISOString()
    };
  }

  static async clearAllCache() {
    return await this.smartRefreshCache('all');
  }

  static async clearHarborCache() {
    return await this.smartRefreshCache('harbors');
  }

  static async clearTriviaCache() {
    return await this.smartRefreshCache('trivia');
  }

  static async refreshCache(type: 'harbors' | 'trivia') {
    return await this.smartRefreshCache(type);
  }

  static async handleImageOperation(operation: 'upload' | 'delete') {
    console.log(`🖼️ Image ${operation} detected, triggering smart harbor refresh...`);
    return await this.smartRefreshCache('harbors');
  }
}