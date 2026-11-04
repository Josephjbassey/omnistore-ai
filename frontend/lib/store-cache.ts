import { StorefrontSchema } from "./api";

// In-memory global store map to retain generated storefronts across serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var _omnistore_stores: Record<string, StorefrontSchema> | undefined;
}

if (!global._omnistore_stores) {
  global._omnistore_stores = {};
}

export function saveStoreToCache(slug: string, schema: StorefrontSchema) {
  if (!global._omnistore_stores) {
    global._omnistore_stores = {};
  }
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-");
  global._omnistore_stores[cleanSlug] = schema;
  return cleanSlug;
}

export function getStoreFromCache(slug: string): StorefrontSchema | null {
  if (!global._omnistore_stores) return null;
  const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-");
  return global._omnistore_stores[cleanSlug] || null;
}
