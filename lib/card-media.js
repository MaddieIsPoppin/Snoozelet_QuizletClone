const MAX_IMAGE_URL_LENGTH = 2048;
const MAX_IMAGE_ALT_LENGTH = 300;
const MAX_PUBLIC_ID_LENGTH = 255;
const PUBLIC_ID_PATTERN = /^[a-zA-Z0-9/_-]+$/;

export function normalizeCardImage({ imageUrl, imagePublicId, imageAlt }) {
  const url = String(imageUrl || "").trim();
  const publicId = String(imagePublicId || "").trim();
  const alt = String(imageAlt || "").trim();

  if (!url && !publicId) {
    return { imageUrl: null, imagePublicId: null, imageAlt: null };
  }
  if (!url || !publicId) throw new Error("Image URL and asset ID must be provided together");
  if (url.length > MAX_IMAGE_URL_LENGTH) throw new Error("Image URL is too long");
  if (publicId.length > MAX_PUBLIC_ID_LENGTH || !PUBLIC_ID_PATTERN.test(publicId)) {
    throw new Error("Invalid image asset ID");
  }
  if (publicId.includes("..")) throw new Error("Invalid image asset ID");
  if (alt.length > MAX_IMAGE_ALT_LENGTH) {
    throw new Error(`Image description must be ${MAX_IMAGE_ALT_LENGTH} characters or fewer`);
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid image URL");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "res.cloudinary.com" ||
    !parsed.pathname.includes("/image/upload/")
  ) {
    throw new Error("Images must use a secure Cloudinary URL");
  }

  return { imageUrl: parsed.toString(), imagePublicId: publicId, imageAlt: alt || null };
}

export const cardImageLimits = {
  maxFileBytes: 5 * 1024 * 1024,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
};
