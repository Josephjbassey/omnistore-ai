import fs from "fs";
import path from "path";
import { StorefrontSchema } from "./api";

// Global cache handle across serverless execution contexts
declare global {
  // eslint-disable-next-line no-var
  var _omnistore_stores: Record<string, StorefrontSchema> | undefined;
}

if (!global._omnistore_stores) {
  global._omnistore_stores = {};
}

const DISK_CACHE_FILE = path.join("/tmp", "omnistore_stores_db.json");

/**
 * Load persisted stores from disk into memory
 */
function loadDiskCache(): Record<string, StorefrontSchema> {
  try {
    if (fs.existsSync(DISK_CACHE_FILE)) {
      const raw = fs.readFileSync(DISK_CACHE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn("[StoreCache] Disk read fallback:", err);
  }
  return {};
}

/**
 * Persist memory stores to disk
 */
function flushToDisk(stores: Record<string, StorefrontSchema>) {
  try {
    fs.writeFileSync(DISK_CACHE_FILE, JSON.stringify(stores, null, 2), "utf-8");
  } catch (err) {
    console.warn("[StoreCache] Disk write skipped:", err);
  }
}

/**
 * Save storefront schema both in-memory and to disk persistence
 */
export function saveStoreToCache(slug: string, schema: StorefrontSchema): string {
  if (!global._omnistore_stores) {
    global._omnistore_stores = loadDiskCache();
  }
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-");
  global._omnistore_stores[cleanSlug] = schema;
  flushToDisk(global._omnistore_stores);
  return cleanSlug;
}

/**
 * Retrieve storefront schema from memory or disk persistence
 */
export function getStoreFromCache(slug: string): StorefrontSchema | null {
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-");

  if (!global._omnistore_stores || !global._omnistore_stores[cleanSlug]) {
    const fromDisk = loadDiskCache();
    if (fromDisk[cleanSlug]) {
      if (!global._omnistore_stores) global._omnistore_stores = {};
      global._omnistore_stores[cleanSlug] = fromDisk[cleanSlug];
      return fromDisk[cleanSlug];
    }
  }

  return (global._omnistore_stores && global._omnistore_stores[cleanSlug]) || null;
}
