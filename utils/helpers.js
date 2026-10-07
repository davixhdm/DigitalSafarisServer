import crypto from "crypto";

const slugify = (str) =>
  String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const generateRef = (prefix = "DS") => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${ts}-${rand}`;
};

const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});

const omit = (obj, keys) =>
  Object.keys(obj).reduce((acc, key) => {
    if (!keys.includes(key)) acc[key] = obj[key];
    return acc;
  }, {});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toRadians = (deg) => (deg * Math.PI) / 180;

const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(String(id));

const parseBoolean = (val) => {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "true";
  return Boolean(val);
};

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

const unique = (arr) => [...new Set(arr)];

const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = typeof key === "function" ? key(item) : item[key];
    acc[k] = acc[k] || [];
    acc[k].push(item);
    return acc;
  }, {});

export {
  slugify,
  generateRef,
  pick,
  omit,
  sleep,
  toRadians,
  isValidObjectId,
  parseBoolean,
  chunk,
  unique,
  groupBy,
};