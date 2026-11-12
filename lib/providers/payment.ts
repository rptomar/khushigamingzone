import QRCode from "qrcode";
import crypto from "crypto";
import { env } from "@/lib/validation/env";

export interface CreateUpiQrParams {
  invoiceId: string;
  invoiceNo: string;
  amountPaise: number;
  upiVpa: string;
  merchantName?: string;
  note?: string;
}

export interface UpiQrResult {
  qrDataUrl: string;
  upiUri: string;
  amountPaise: number;
  providerRef: string;
}

export interface WebhookVerificationResult {
  verified: boolean;
  invoiceId?: string;
  paymentId?: string;
  amountPaise?: number;
  method?: string;
  rawPayload?: any;
  error?: string;
}

export interface IPaymentProvider {
  createUpiQr(params: CreateUpiQrParams): Promise<UpiQrResult>;
  verifyWebhook(body: string, signature: string): Promise<WebhookVerificationResult>;
  checkPaymentStatus(providerRef: string): Promise<{ isPaid: boolean; status: string; amountPaise?: number }>;
}

export class MockPaymentProvider implements IPaymentProvider {
  async createUpiQr(params: CreateUpiQrParams): Promise<UpiQrResult> {
    const amountRupees = (params.amountPaise / 100).toFixed(2);
    const merchantName = encodeURIComponent(params.merchantName || "Khushi Gaming Zone");
    const note = encodeURIComponent(params.note || `Table Bill #${params.invoiceNo}`);
    const tr = params.invoiceNo;
    
    // Standard UPI deep link format
    const upiUri = `upi://pay?pa=${params.upiVpa}&pn=${merchantName}&am=${amountRupees}&cu=INR&tn=${note}&tr=${tr}`;
    
    // Generate high-resolution QR data URL
    const qrDataUrl = await QRCode.toDataURL(upiUri, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 380,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    const providerRef = `mock_pay_${Date.now()}_${params.invoiceNo}`;

    return {
      qrDataUrl,
      upiUri,
      amountPaise: params.amountPaise,
      providerRef,
    };
  }

  async verifyWebhook(body: string, signature: string): Promise<WebhookVerificationResult> {
    try {
      const payload = typeof body === "string" ? JSON.parse(body) : body;
      return {
        verified: true,
        invoiceId: payload.invoiceId || payload.payload?.payment?.entity?.notes?.invoice_id,
        paymentId: payload.paymentId || payload.payload?.payment?.entity?.id || `mock_${Date.now()}`,
        amountPaise: payload.amountPaise || payload.payload?.payment?.entity?.amount || 0,
        method: payload.method || "upi",
        rawPayload: payload,
      };
    } catch {
      return { verified: false, error: "Invalid JSON in mock webhook" };
    }
  }

  async checkPaymentStatus(providerRef: string): Promise<{ isPaid: boolean; status: string; amountPaise?: number }> {
    return {
      isPaid: false,
      status: "pending",
    };
  }
}

export class RazorpayPaymentProvider implements IPaymentProvider {
  private keyId: string;
  private keySecret: string;
  private webhookSecret: string;

  constructor() {
    this.keyId = env.RAZORPAY_KEY_ID;
    this.keySecret = env.RAZORPAY_KEY_SECRET;
    this.webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
  }

  async createUpiQr(params: CreateUpiQrParams): Promise<UpiQrResult> {
    // If running in development or keys are mock defaults, fallback cleanly to mock QR
    if (!this.keyId || this.keyId.startsWith("rzp_test_mock")) {
      const mock = new MockPaymentProvider();
      return mock.createUpiQr(params);
    }

    try {
      // In production Razorpay, invoke Razorpay Dynamic QR Codes API: POST /v1/payments/qr_codes
      const authHeader = "Basic " + Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
      const res = await fetch("https://api.razorpay.com/v1/payments/qr_codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          type: "upi_qr",
          name: params.merchantName || "Khushi Gaming Zone",
          usage: "single_use",
          fixed_amount: true,
          payment_amount: params.amountPaise,
          description: `Bill ${params.invoiceNo}`,
          notes: {
            invoice_id: params.invoiceId,
            invoice_no: params.invoiceNo,
          },
        }),
      });

      if (!res.ok) {
        console.warn("Razorpay QR creation returned error, falling back to direct UPI QR");
        const mock = new MockPaymentProvider();
        return mock.createUpiQr(params);
      }

      const data = await res.json();
      return {
        qrDataUrl: data.image_url,
        upiUri: data.upi_intent_url || `upi://pay?pa=${params.upiVpa}&am=${params.amountPaise / 100}`,
        amountPaise: params.amountPaise,
        providerRef: data.id,
      };
    } catch (err) {
      console.error("Failed to create Razorpay QR:", err);
      const mock = new MockPaymentProvider();
      return mock.createUpiQr(params);
    }
  }

  async verifyWebhook(body: string, signature: string): Promise<WebhookVerificationResult> {
    if (!signature) {
      return { verified: false, error: "Missing webhook signature" };
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(body)
        .digest("hex");

      const verified = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!verified) {
        return { verified: false, error: "Invalid HMAC signature" };
      }

      const payload = JSON.parse(body);
      const paymentEntity = payload.payload?.payment?.entity;

      return {
        verified: true,
        invoiceId: paymentEntity?.notes?.invoice_id,
        paymentId: paymentEntity?.id,
        amountPaise: paymentEntity?.amount,
        method: paymentEntity?.method || "upi",
        rawPayload: payload,
      };
    } catch (err: any) {
      return { verified: false, error: err.message || "Failed to verify webhook signature" };
    }
  }

  async checkPaymentStatus(providerRef: string): Promise<{ isPaid: boolean; status: string; amountPaise?: number }> {
    if (!providerRef || providerRef.startsWith("mock_")) {
      return { isPaid: false, status: "pending" };
    }
    try {
      const authHeader = "Basic " + Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
      const res = await fetch(`https://api.razorpay.com/v1/payments/qr_codes/${providerRef}/payments`, {
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        const data = await res.json();
        const success = data.items?.some((p: any) => p.status === "captured");
        return {
          isPaid: success,
          status: success ? "paid" : "pending",
        };
      }
    } catch (e) {
      console.error("Razorpay check status failed:", e);
    }
    return { isPaid: false, status: "pending" };
  }
}

export function getPaymentProvider(): IPaymentProvider {
  if (env.PAYMENT_PROVIDER === "razorpay") {
    return new RazorpayPaymentProvider();
  }
  return new MockPaymentProvider();
}
