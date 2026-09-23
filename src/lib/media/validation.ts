const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/postscript",         // AI/EPS
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/zip",
  "application/x-zip-compressed",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export function validateFile(
  mimeType: string,
  size: number,
  filename: string
): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return { valid: false, error: `Tipe file '${mimeType}' tidak diizinkan` };
  }

  if (size > MAX_FILE_SIZE) {
    return { valid: false, error: `Ukuran file melebihi batas ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  if (size === 0) {
    return { valid: false, error: "File kosong" };
  }

  // Prevent path traversal in filename
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (sanitized !== filename && filename.includes("..")) {
    return { valid: false, error: "Nama file tidak valid" };
  }

  return { valid: true };
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 200);
}
