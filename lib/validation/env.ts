import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgres://postgres:postgres@localhost:5432/khushigamingzone"),
  JWT_SECRET: z.string().min(16).default("khushi-gaming-zone-super-secret-jwt-key-min-32-chars-long!"),
  CRON_SECRET: z.string().min(1).default("khushi-cron-secret-change-me"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  
  OTP_PROVIDER: z.enum(["mock", "msg91"]).default("mock"),
  WHATSAPP_PROVIDER: z.enum(["mock", "meta", "interakt"]).default("mock"),
  PAYMENT_PROVIDER: z.enum(["mock", "razorpay"]).default("mock"),
  
  CLOUDINARY_CLOUD_NAME: z.string().default("demo"),
  CLOUDINARY_API_KEY: z.string().default("123456789012345"),
  CLOUDINARY_API_SECRET: z.string().default("mock_cloudinary_secret"),
  
  RAZORPAY_KEY_ID: z.string().default("rzp_test_mock123"),
  RAZORPAY_KEY_SECRET: z.string().default("mock_razorpay_secret"),
  RAZORPAY_WEBHOOK_SECRET: z.string().default("mock_razorpay_webhook_secret"),
  
  MSG91_AUTH_KEY: z.string().default("mock_msg91_key"),
  WHATSAPP_API_KEY: z.string().default("mock_whatsapp_key"),
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    // In build phase without full env, provide defaults
    return envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/khushigamingzone",
      JWT_SECRET: process.env.JWT_SECRET || "khushi-gaming-zone-super-secret-jwt-key-min-32-chars-long!",
      CRON_SECRET: process.env.CRON_SECRET || "khushi-cron-secret-change-me",
      APP_URL: process.env.APP_URL || "http://localhost:3000",
      OTP_PROVIDER: process.env.OTP_PROVIDER || "mock",
      WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER || "mock",
      PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || "mock",
    });
  }
  return parsed.data;
}

export const env = getEnv();

