import { createClient } from "redis";
import { env } from "./env.js";

let client = null;

const connectRedis = async () => {
  if (!env.redisEnabled) return null;

  client = createClient({ url: env.redisUrl });

  client.on("error", () => {});

  await client.connect();
  return client;
};

const getRedis = () => {
  if (!env.redisEnabled) return null;
  if (!client) throw new Error("Redis not initialized");
  return client;
};

const disconnectRedis = async () => {
  if (client) {
    await client.quit();
    client = null;
  }
};

export { connectRedis, getRedis, disconnectRedis };