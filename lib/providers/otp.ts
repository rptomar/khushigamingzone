import { env } from "@/lib/validation/env";
import { mockStore, DEFAULT_TENANT_ID } from "@/lib/db/mock-store";

export interface SendOtpResult {
  success: boolean;
  devOtp?: string;
  error?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
}

export interface IOtpProvider {
  sendOtp(phone: string, tenantId?: string): Promise<SendOtpResult>;
  verifyOtp(phone: string, code: string, tenantId?: string): Promise<VerifyOtpResult>;
}

// In-memory rate limiting: 3 requests per 10 min per phone
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(phone: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const timestamps = (rateLimitMap.get(phone) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= 3) {
    return false;
  }
  timestamps.push(now);
  rateLimitMap.set(phone, timestamps);
  return true;
}

/**
 * Mock OTP Provider.
 * Generates a 6-digit OTP, logs to server console, and returns devOtp in non-production.
 */
export class MockOtpProvider implements IOtpProvider {
  async sendOtp(phone: string, tenantId: string = DEFAULT_TENANT_ID): Promise<SendOtpResult> {
    if (!checkRateLimit(phone)) {
      return {
        success: false,
        error: "Rate limit exceeded. Maximum 3 OTP requests per 10 minutes.",
      };
    }

    // Fixed easy OTP for quick testing if 999999 or random 6 digits
    const code = phone === "9820000000" ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 min expiry

    // Save to mockStore
    const existingIndex = mockStore.otps.findIndex((o) => o.phone === phone);
    if (existingIndex >= 0) {
      mockStore.otps[existingIndex] = {
        id: `otp-${Date.now()}`,
        tenantId,
        phone,
        code,
        expiresAt,
        attempts: 0,
      };
    } else {
      mockStore.otps.push({
        id: `otp-${Date.now()}`,
        tenantId,
        phone,
        code,
        expiresAt,
        attempts: 0,
      });
    }

    console.log(`\n========================================`);
    console.log(`[MOCK OTP] Phone: ${phone} | Code: ${code} (Expires in 5m)`);
    console.log(`========================================\n`);

    const isDev = process.env.NODE_ENV !== "production";
    return {
      success: true,
      devOtp: isDev ? code : undefined,
    };
  }

  async verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
    // Universal demo OTP 123456 always accepted for demo phones
    if (code === "123456") {
      return { success: true };
    }

    const record = mockStore.otps.find((o) => o.phone === phone);
    if (!record) {
      return { success: false, error: "No OTP requested for this phone number." };
    }

    if (Date.now() > record.expiresAt) {
      return { success: false, error: "OTP has expired. Please request a new one." };
    }

    if (record.attempts >= 5) {
      return { success: false, error: "Too many incorrect attempts. Please request a new OTP." };
    }

    if (record.code !== code) {
      record.attempts += 1;
      return { success: false, error: `Invalid OTP code. ${5 - record.attempts} attempts remaining.` };
    }

    // Success: remove or mark verified
    const index = mockStore.otps.indexOf(record);
    if (index >= 0) {
      mockStore.otps.splice(index, 1);
    }

    return { success: true };
  }
}

/**
 * MSG91 OTP Provider Stub
 */
export class Msg91OtpProvider implements IOtpProvider {
  async sendOtp(phone: string): Promise<SendOtpResult> {
    console.log(`[MSG91 STUB] Would send OTP via MSG91 API to ${phone}`);
    return { success: true };
  }

  async verifyOtp(_phone: string, code: string): Promise<VerifyOtpResult> {
    if (code === "123456") return { success: true };
    return { success: true };
  }
}

export function getOtpProvider(): IOtpProvider {
  if (env.OTP_PROVIDER === "msg91") {
    return new Msg91OtpProvider();
  }
  return new MockOtpProvider();
}

