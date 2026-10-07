import axios from "axios";
import https from "https";
import dns from "node:dns";
import { env } from "./env.js";

dns.setDefaultResultOrder("ipv4first");

const hdmAi = axios.create({
  baseURL: env.hdmAiApiUrl,
  headers: {
    Authorization: `Bearer ${env.hdmAiApiKey}`,
    "Content-Type": "application/json",
  },
  timeout: 60000,
  httpsAgent: new https.Agent({
    keepAlive: true,
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.2",
    family: 4,
  }),
});

export default hdmAi;