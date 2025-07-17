// components/admin/cache-management.tsx
"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Trash2, Zap, Info, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CacheService } from "@/lib/cache-service";

export default function CacheManagement() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [lastOperation, setLastOperation] = useState<string | null>(null);

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      setLoading(true);
      const cacheStats = await CacheService.getCacheStats();
      setStats(cacheStats);
    } catch (error) {
      console.error('Error loading cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async (type: 'all' | 'harbors' | 'trivia') => {
    try {
      setLoading(true);
      let result;
      
      switch (type) {
        case 'all':
          result = await CacheService.clearAllCache();
          setLastOperation('Cleared all cache');
          break;
        case 'harbors':
          result = await CacheService.clearHarborCache();
          setLastOperation('Cleared harbor cache');
          break;
        case 'trivia':
          result = await CacheService.clearTriviaCache();
          setLastOperation('Cleared trivia cache');
          break;
      }
      
      // Reload stats
      await loadCacheStats();
      
    } catch (error) {
      console.error(`Error clearing ${type} cache:`, error);
      setLastOperation(`Failed to clear ${type} cache`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCache = async (type: 'harbors' | 'trivia') => {
    try {
      setLoading(true);
      await CacheService.refreshCache(type);
      setLastOperation(`Refreshed ${type} cache`);
      await loadCacheStats();
    } catch (error) {
      console.error(`Error refreshing ${type} cache:`, error);
      setLastOperation(`Failed to refresh ${type} cache`);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCacheStatus = (key: string) => {
    if (!stats?.keys) return 'unknown';
    const keyData = stats.keys[key];
    return keyData?.exists ? 'cached' : 'empty';
  };

  const getCacheStatusIcon = (status: string) => {
    switch (status) {
      case 'cached':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'empty':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-400" />;
    }
  };

  const languages = ['fi', 'en', 'sv'];
  const cacheTypes = ['harbors', 'trivia'];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common cache management operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => handleClearCache('all')} 
              disabled={loading}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Cache
            </Button>
            <Button 
              onClick={() => handleClearCache('harbors')} 
              disabled={loading}
              variant="outline"
            >
              Clear Harbor Cache
            </Button>
            <Button 
              onClick={() => handleClearCache('trivia')} 
              disabled={loading}
              variant="outline"
            >
              Clear Trivia Cache
            </Button>
            <Button 
              onClick={() => handleRefreshCache('harbors')} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Harbor Cache
            </Button>
            <Button 
              onClick={() => handleRefreshCache('trivia')} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Trivia Cache
            </Button>
          </div>
          
          {lastOperation && (
            <Alert className="mt-4">
              <Info className="h-4 w-4" />
              <AlertDescription>
                {lastOperation} at {new Date().toLocaleTimeString()}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Cache Status</CardTitle>
              <CardDescription>
                Current state of all cache keys
              </CardDescription>
            </div>
            <Button 
              onClick={loadCacheStats} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && !stats ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : stats ? (
            <div className="space-y-4">
              {/* Cache Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">v{stats.cache_version}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cache Version</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.cache_ttl}s</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">TTL (1 year)</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.values(stats.keys).filter((k: any) => k.exists).length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Active Caches</div>
                </div>
              </div>

              {/* Cache Keys Status */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg">Cache Keys Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cacheTypes.map(type => (
                    <div key={type} className="border rounded-lg p-4">
                      <h5 className="font-medium capitalize mb-3 flex items-center gap-2">
                        {type === 'harbors' ? '🏠' : '❓'} {type}
                      </h5>
                      <div className="space-y-2">
                        {languages.map(lang => {
                          const cacheKey = `v1:${type}:${lang}`;
                          const keyData = stats.keys[cacheKey];
                          const status = getCacheStatus(cacheKey);
                          
                          return (
                            <div key={lang} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                              <div className="flex items-center gap-2">
                                {getCacheStatusIcon(status)}
                                <span className="font-mono text-sm">{lang.toUpperCase()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {keyData?.exists && (
                                  <>
                                    <Badge variant="secondary" className="text-xs">
                                      {keyData.items_count} items
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {formatBytes(keyData.size_bytes)}
                                    </Badge>
                                  </>
                                )}
                                <Badge 
                                  variant={status === 'cached' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Failed to load cache statistics</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How Cache Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            How Cache Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">🚀 When Cache is Used:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• Users load the game → API checks cache first</li>
                <li>• If cached → Instant response (5-15ms)</li>
                <li>• If empty → Database query + cache (200-500ms)</li>
                <li>• Cache expires after 1 year automatically</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">⚡ When to Clear Cache:</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>• After editing harbor/trivia data</li>
                <li>• When content isn't updating live</li>
                <li>• Before deploying major changes</li>
                <li>• When testing new content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}