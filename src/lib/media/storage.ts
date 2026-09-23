import type { StorageProvider } from "./types";

/**
 * Resolve storage at runtime so production does not accidentally fall back
 * to a local filesystem provider on serverless infrastructure.
 */
export async function getStorageProvider(): Promise<StorageProvider> {
  const hasCloudinary = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (process.env.NODE_ENV === "production") {
    if (!hasCloudinary) {
      throw new Error(
        "Production storage requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET"
      );
    }
    const { CloudinaryStorageProvider } = await import("./cloudinary-provider");
    return new CloudinaryStorageProvider();
  }

  if (hasCloudinary) {
    const { CloudinaryStorageProvider } = await import("./cloudinary-provider");
    return new CloudinaryStorageProvider();
  }

  const { LocalStorageProvider } = await import("./local-provider");
  return new LocalStorageProvider();
}
