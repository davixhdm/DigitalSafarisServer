import axios from "axios";
import https from "https";
import dns from "node:dns";
import { env } from "./env.js";

dns.setDefaultResultOrder("ipv4first");

const hdmBridge = axios.create({
  baseURL: env.hdmApiUrl,
  headers: {
    Authorization: `Bearer ${env.hdmApiKey}`,
    "Content-Type": "application/json",
  },
  timeout: 30000,
  httpsAgent: new https.Agent({
    keepAlive: true,
    minVersion: "TLSv1.2",
    maxVersion: "TLSv1.2",
    family: 4,
  }),
});

export default hdmBridge;