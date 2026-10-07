import dns from "node:dns";
import { EventEmitter } from "node:events";

EventEmitter.defaultMaxListeners = 25;

dns.setDefaultResultOrder("ipv4first");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

process.removeAllListeners("warning");
process.on("warning", (warning) => {
  if (warning.name === "DeprecationWarning" && warning.message.includes("punycode")) {
    return;
  }
  if (warning.name === "MaxListenersExceededWarning") {
    return;
  }
  console.warn(warning.name, warning.message);
});