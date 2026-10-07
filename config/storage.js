import { env } from "./env.js";
import cloudinary from "./cloudinary.js";

const storageConfig = {
  provider: env.storageProvider,
  local: {
    path: env.localStoragePath,
    url: env.localStorageUrl,
  },
  cloudinary,
};

export default storageConfig;