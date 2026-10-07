import chalk from "chalk";
import { env } from "../config/env.js";

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = env.nodeEnv === "production" ? LEVELS.info : LEVELS.debug;

const colorize = {
  error: (s) => chalk.red(s),
  warn: (s) => chalk.yellow(s),
  info: (s) => chalk.cyan(s),
  debug: (s) => chalk.magenta(s),
};

const format = (level, message, meta) => {
  const ts = new Date().toISOString();
  const tag = colorize[level](level.toUpperCase().padEnd(5));
  const time = chalk.gray(ts);
  const msg = chalk.bold(message);

  let line = `${time} ${tag} ${msg}`;
  if (meta && Object.keys(meta).length > 0) {
    line += ` ${chalk.dim(JSON.stringify(meta))}`;
  }
  return line;
};

const log = (level, message, meta = {}) => {
  if (LEVELS[level] > currentLevel) return;
  const line = format(level, message, meta);
  if (level === "error" || level === "warn") process.stderr.write(line + "\n");
  else process.stdout.write(line + "\n");
};

const logger = {
  error: (m, meta) => log("error", m, meta),
  warn: (m, meta) => log("warn", m, meta),
  info: (m, meta) => log("info", m, meta),
  debug: (m, meta) => log("debug", m, meta),
};

export default logger;