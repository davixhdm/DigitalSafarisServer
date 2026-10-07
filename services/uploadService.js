import fs from "fs";
import path from "path";
import cloudinary from "../config/cloudinary.js";
import storageConfig from "../config/storage.js";
import logger from "../utils/logger.js";

const uploadToCloudinary = (buffer, folder = "digitalsafaris") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (err, result) => {
        if (err) reject(err);
        else resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

const uploadToLocal = async (buffer, originalName, folder = "general") => {
  const dir = path.join(storageConfig.local.path, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(originalName);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filepath = path.join(dir, name);

  fs.writeFileSync(filepath, buffer);

  return {
    url: `${storageConfig.local.url}/${folder}/${name}`,
    publicId: `${folder}/${name}`,
  };
};

const uploadFile = async (buffer, originalName, folder = "general") => {
  try {
    if (storageConfig.provider === "cloudinary") {
      return await uploadToCloudinary(buffer, folder);
    }
    return await uploadToLocal(buffer, originalName, folder);
  } catch (err) {
    logger.error("Upload failed", { error: err.message });
    throw err;
  }
};

const deleteFile = async (publicId) => {
  try {
    if (storageConfig.provider === "cloudinary") {
      await cloudinary.uploader.destroy(publicId);
    } else {
      const filepath = path.join(storageConfig.local.path, publicId);
      if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    }
    return { success: true };
  } catch (err) {
    logger.error("Delete file failed", { error: err.message });
    return { success: false, error: err.message };
  }
};

export { uploadFile, deleteFile };