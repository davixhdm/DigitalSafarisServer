import mongoose from "mongoose";
import { env } from "./env.js";

const connectDB = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongodbUri, {
    autoIndex: env.nodeEnv !== "production",
    serverSelectionTimeoutMS: 30000,
  });
  return mongoose.connection;
};

const disconnectDB = async () => {
  await mongoose.connection.close();
};

export { connectDB, disconnectDB };