import crypto from "crypto";
import { env } from "@/lib/validation/env";

export interface UploadOptions {
  folder: string;
  filename: string;
  contentType?: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
  format?: string;
  bytes?: number;
}

export interface IStorageProvider {
  uploadBuffer(buffer: Buffer, options: UploadOptions): Promise<UploadResult>;
  getSignedUploadParams(folder: string): { timestamp: number; signature: string; apiKey: string; cloudName: string };
}

export class MockStorageProvider implements IStorageProvider {
  async uploadBuffer(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const publicId = `${options.folder}/${options.filename.replace(/\.[^/.]+$/, "")}_${Date.now()}`;
    const url = `https://res.cloudinary.com/ps07-gaming-demo/image/upload/v1700000000/${publicId}.pdf`;
    
    console.log(`[STORAGE MOCK] Uploaded ${buffer.length} bytes to ${url}`);
    
    return {
      url,
      publicId,
      format: "pdf",
      bytes: buffer.length,
    };
  }

  getSignedUploadParams(folder: string) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = crypto
      .createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}mock_secret`)
      .digest("hex");

    return {
      timestamp,
      signature,
      apiKey: "mock_api_key",
      cloudName: "ps07-gaming-demo",
    };
  }
}

export class CloudinaryStorageProvider implements IStorageProvider {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = env.CLOUDINARY_CLOUD_NAME;
    this.apiKey = env.CLOUDINARY_API_KEY;
    this.apiSecret = env.CLOUDINARY_API_SECRET;
  }

  async uploadBuffer(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    if (!this.apiSecret || this.apiSecret.startsWith("mock_")) {
      const mock = new MockStorageProvider();
      return mock.uploadBuffer(buffer, options);
    }

    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const paramsToSign = `folder=${options.folder}&public_id=${options.filename}&timestamp=${timestamp}`;
      const signature = crypto
        .createHash("sha1")
        .update(paramsToSign + this.apiSecret)
        .digest("hex");

      const formData = new FormData();
      formData.append("file", new Blob([new Uint8Array(buffer)], { type: options.contentType || "application/pdf" }), options.filename);
      formData.append("api_key", this.apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", options.folder);
      formData.append("public_id", options.filename);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        console.warn("Cloudinary upload failed, falling back to mock:", err);
        const mock = new MockStorageProvider();
        return mock.uploadBuffer(buffer, options);
      }

      const data = await res.json();
      return {
        url: data.secure_url || data.url,
        publicId: data.public_id,
        format: data.format,
        bytes: data.bytes,
      };
    } catch (err) {
      console.error("Cloudinary upload exception:", err);
      const mock = new MockStorageProvider();
      return mock.uploadBuffer(buffer, options);
    }
  }

  getSignedUploadParams(folder: string) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = crypto
      .createHash("sha1")
      .update(`folder=${folder}&timestamp=${timestamp}${this.apiSecret}`)
      .digest("hex");

    return {
      timestamp,
      signature,
      apiKey: this.apiKey,
      cloudName: this.cloudName,
    };
  }
}

export function getStorageProvider(): IStorageProvider {
  return new CloudinaryStorageProvider();
}

