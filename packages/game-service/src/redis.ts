import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    await redisClient.connect();
  }
  return redisClient;
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const client = await getRedisClient();
  return client.get(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const client = await getRedisClient();
  if (ttlSeconds) {
    await client.setEx(key, ttlSeconds, value);
  } else {
    await client.set(key, value);
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = await getRedisClient();
  await client.del(key);
}
