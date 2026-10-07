import { getRedis } from "../config/redis.js";

const setCache = async (key, value, ttlSeconds = 300) => {
  const redis = getRedis();
  if (!redis) return;
  await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
};

const getCache = async (key) => {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
};

const deleteCache = async (key) => {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(key);
};

const deleteCachePattern = async (pattern) => {
  const redis = getRedis();
  if (!redis) return;
  const keys = [];
  for await (const key of redis.scanIterator({ MATCH: pattern })) {
    keys.push(key);
  }
  if (keys.length > 0) await redis.del(keys);
};

export { setCache, getCache, deleteCache, deleteCachePattern };