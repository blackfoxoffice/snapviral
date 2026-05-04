import { getServiceClient } from './supabase.js';

interface CacheEntry {
  value: string;
  fetchedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

/**
 * Read a secret value. Tries the Supabase Vault first (via the service_read_secret RPC),
 * falls back to process.env if the secret isn't in the vault. Cached for 5 minutes.
 *
 * The vault decrypts inside Postgres using libsodium / AES-256. Plaintext only ever exists
 * inside the running API process (and the in-memory cache), never on disk.
 */
export async function getSecret(keyName: string): Promise<string | undefined> {
  const cached = cache.get(keyName);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.value;
  }

  try {
    const supa = getServiceClient();
    const { data, error } = await supa.rpc('service_read_secret', { p_key_name: keyName });
    if (!error && typeof data === 'string' && data.length > 0) {
      cache.set(keyName, { value: data, fetchedAt: Date.now() });
      return data;
    }
  } catch (e) {
    // fall through to env fallback
  }

  const envValue = process.env[keyName];
  if (envValue && envValue.length > 0) {
    cache.set(keyName, { value: envValue, fetchedAt: Date.now() });
    return envValue;
  }

  return undefined;
}

export async function requireSecret(keyName: string): Promise<string> {
  const v = await getSecret(keyName);
  if (!v) throw new Error(`Required secret '${keyName}' is not configured (vault or env)`);
  return v;
}

/**
 * Clear cache for a single key (call after rotation) or all keys (deploy hook).
 */
export function invalidateSecretCache(keyName?: string) {
  if (keyName) cache.delete(keyName);
  else cache.clear();
}
