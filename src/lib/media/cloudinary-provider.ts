import type { StorageProvider, UploadOptions, UploadResult } from "./types";

/**
 * Cloudinary storage provider.
 * Requires: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */
export class CloudinaryStorageProvider implements StorageProvider {
  readonly name = "cloudinary";
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
    this.apiKey = process.env.CLOUDINARY_API_KEY || "";
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || "";

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error("Cloudinary credentials not configured");
    }
  }

  async upload(buffer: Buffer, filename: string, mimeType: string, options?: UploadOptions): Promise<UploadResult> {
    const folder = options?.folder || options?.purpose || "general";
    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;

    const base64 = `data:${mimeType};base64,${buffer.toString("base64")}`;
    const timestamp = Math.floor(Date.now() / 1000);
    // publicId already embeds the folder prefix (e.g. "product_image/167...-file").
    // Cloudinary nests paths when BOTH a slash-containing public_id AND a
    // separate `folder` field are sent — that's what caused the doubled
    // "product_image/product_image/..." path. Only public_id is needed.
    const publicId = `${folder}/${Date.now()}-${filename.replace(/\.[^.]+$/, "")}`;

    // Generate signature
    const crypto = await import("crypto");
    const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

    const formData = new FormData();
    formData.append("file", base64);
    formData.append("public_id", publicId);
    formData.append("timestamp", String(timestamp));
    formData.append("api_key", this.apiKey);
    formData.append("signature", signature);

    const response = await fetch(uploadUrl, { method: "POST", body: formData });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Cloudinary upload failed: ${err}`);
    }

    const data = await response.json();

    return {
      storageKey: `${mimeType.startsWith("video/") ? "video:" : "image:"}${data.public_id}`,
      url: data.secure_url,
      filename: data.original_filename || filename,
      size: data.bytes || buffer.length,
      mimeType,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const crypto = await import("crypto");
    const resourceType = storageKey.startsWith("video:") ? "video" : "image";
    const publicId = storageKey.replace(/^(video:|image:)/, "");
    const signatureStr = `public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");
    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/destroy`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id: publicId, timestamp, api_key: this.apiKey, signature }),
    });
  }

  getUrl(storageKey: string): string {
    const resourceType = storageKey.startsWith("video:") ? "video" : "image";
    const publicId = storageKey.replace(/^(video:|image:)/, "");
    return `https://res.cloudinary.com/${this.cloudName}/${resourceType}/upload/${publicId}`;
  }
}
