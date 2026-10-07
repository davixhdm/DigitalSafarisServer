import chalk from "chalk";
import { env } from "../../config/env.js";

const colorMethod = (m) => {
  if (m === "GET") return chalk.green(m);
  if (m === "POST") return chalk.blue(m);
  if (m === "PUT" || m === "PATCH") return chalk.yellow(m);
  if (m === "DELETE") return chalk.red(m);
  return chalk.white(m);
};

const colorStatus = (s) => {
  if (s >= 500) return chalk.red.bold(s);
  if (s >= 400) return chalk.yellow.bold(s);
  if (s >= 300) return chalk.cyan.bold(s);
  if (s >= 200) return chalk.green.bold(s);
  return chalk.white.bold(s);
};

const colorTime = (t) => {
  if (!t) return chalk.dim("-");
  const str = `${t.toFixed(3)} ms`;
  if (t > 1000) return chalk.red(str);
  if (t > 500) return chalk.yellow(str);
  if (t > 100) return chalk.cyan(str);
  return chalk.green(str);
};

const colorSize = (s) => (s ? chalk.magenta(s) : chalk.dim("-"));

const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    const size = res.getHeader("content-length");

    const line =
      `${colorMethod(req.method)} ` +
      `${chalk.dim(req.originalUrl)} ` +
      `${colorStatus(res.statusCode)} ` +
      `${colorTime(ms)} - ` +
      `${colorSize(size)}`;

    if (res.statusCode >= 500) process.stderr.write(line + "\n");
    else process.stdout.write(line + "\n");
  });

  next();
};

export default requestLogger;