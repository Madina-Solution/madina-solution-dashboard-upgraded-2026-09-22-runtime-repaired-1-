import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import type { StorageProvider, UploadOptions, UploadResult } from "./types";

/**
 * Local filesystem storage provider.
 * Used when Cloudinary or other external storage is not configured.
 * Files are stored in /public/uploads/ and served statically.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";
  private basePath: string;
  private baseUrl: string;

  constructor() {
    this.basePath = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads");
    this.baseUrl = "/uploads";
  }

  async upload(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const folder = options?.folder || options?.purpose || "general";
    const dirPath = path.join(this.basePath, folder);
    await mkdir(dirPath, { recursive: true });

    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${filename}`;
    const filePath = path.join(dirPath, uniqueName);
    const storageKey = `${folder}/${uniqueName}`;

    await writeFile(filePath, buffer);

    return {
      storageKey,
      url: `${this.baseUrl}/${storageKey}`,
      filename: uniqueName,
      size: buffer.length,
      mimeType,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = path.join(this.basePath, storageKey);
    try {
      await unlink(filePath);
    } catch {
      // File may not exist — silent
    }
  }

  getUrl(storageKey: string): string {
    return `${this.baseUrl}/${storageKey}`;
  }
}
