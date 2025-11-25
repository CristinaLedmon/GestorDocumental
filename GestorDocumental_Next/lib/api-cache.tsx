// Sistema de caché global para compartir entre componentes
type CacheEntry<T> = {
    data: T
    timestamp: number
  }
  
  class ApiCache {
    private cache = new Map<string, CacheEntry<any>>()
    private defaultDuration = 5 * 60 * 1000 // 5 minutos por defecto
  
    get<T>(key: string, duration = this.defaultDuration): T | null {
      const entry = this.cache.get(key)
      const now = Date.now()
  
      if (entry && now - entry.timestamp < duration) {
        return entry.data as T
      }
  
      return null
    }
  
    set<T>(key: string, data: T): void {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
      })
    }
  
    clear(): void {
      this.cache.clear()
    }
  
    remove(key: string): void {
      this.cache.delete(key)
    }
  
    // Limpiar entradas caducadas
    // cleanup(duration = this.defaultDuration): void {
    //   const now = Date.now()
    //   for (const [key, entry] of this.cache.entries()) {
    //     if (now - entry.timestamp > duration) {
    //       this.cache.delete(key)
    //     }
    //   }
    // }
  }
  
  // Exportar una instancia singleton
  export const apiCache = new ApiCache()
  
  // Función de utilidad para envolver fetchModel con caché
  export async function fetchWithCache<T>(
    url: string,
    fetchFn: (url: string) => Promise<T>,
    cacheDuration?: number,
  ): Promise<T> {
    const cachedData = apiCache.get<T>(url, cacheDuration)
  
    if (cachedData) {
      return cachedData
    }
  
    const response = await fetchFn(url)
    apiCache.set(url, response)
    return response
  }
  
  