import crypto from "node:crypto";

const UPLOAD_FOLDER = "snoozelet/cards";

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export function createImageUploadSignature(timestamp) {
  const config = getCloudinaryConfig();
  if (!config) return null;

  const parameters = `folder=${UPLOAD_FOLDER}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(`${parameters}${config.apiSecret}`)
    .digest("hex");

  return {
    apiKey: config.apiKey,
    cloudName: config.cloudName,
    folder: UPLOAD_FOLDER,
    signature,
    timestamp,
  };
}
