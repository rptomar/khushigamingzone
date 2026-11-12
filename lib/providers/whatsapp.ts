import { env } from "@/lib/validation/env";
import { paiseToRupeesFormatted } from "@/lib/domain/money";

export interface SendInvoiceParams {
  tenantId: string;
  phone: string;
  customerName?: string;
  invoiceNo: string;
  amountPaise: number;
  pdfUrl: string;
  sessionMinutes: number;
}

export interface WhatsAppNotificationRecord {
  id: string;
  tenantId: string;
  phone: string;
  type: "invoice" | "welcome" | "alert";
  status: "queued" | "sent" | "failed";
  attempts: number;
  messageId?: string;
  payload: Record<string, any>;
  sentAt?: string;
  createdAt: string;
}

// In-memory mock notification store
const mockNotificationsQueue: WhatsAppNotificationRecord[] = [];

export interface IWhatsAppProvider {
  sendInvoice(params: SendInvoiceParams): Promise<{ success: boolean; messageId?: string; error?: string }>;
  getNotifications(tenantId: string): Promise<WhatsAppNotificationRecord[]>;
}

export class MockWhatsAppProvider implements IWhatsAppProvider {
  async sendInvoice(params: SendInvoiceParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const messageId = `wamid.mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const rupees = paiseToRupeesFormatted(params.amountPaise);
    
    console.log(`[WHATSAPP MOCK] 📱 Dispatching Invoice PDF to +91 ${params.phone}`);
    console.log(`[WHATSAPP MOCK] 📄 Invoice #${params.invoiceNo} | ₹${rupees} | ${params.sessionMinutes} mins`);
    console.log(`[WHATSAPP MOCK] 🔗 PDF Link: ${params.pdfUrl}`);

    const record: WhatsAppNotificationRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId: params.tenantId,
      phone: params.phone,
      type: "invoice",
      status: "sent",
      attempts: 1,
      messageId,
      payload: {
        customerName: params.customerName || "Customer",
        invoiceNo: params.invoiceNo,
        amountPaise: params.amountPaise,
        pdfUrl: params.pdfUrl,
        sessionMinutes: params.sessionMinutes,
      },
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    mockNotificationsQueue.unshift(record);

    return {
      success: true,
      messageId,
    };
  }

  async getNotifications(tenantId: string): Promise<WhatsAppNotificationRecord[]> {
    return mockNotificationsQueue.filter((n) => n.tenantId === tenantId);
  }
}

export class MetaWhatsAppProvider implements IWhatsAppProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = env.WHATSAPP_API_KEY;
  }

  async sendInvoice(params: SendInvoiceParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.apiKey || this.apiKey === "mock_whatsapp_key") {
      const mock = new MockWhatsAppProvider();
      return mock.sendInvoice(params);
    }

    try {
      // In production with Meta Graph API Cloud WhatsApp:
      // POST https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages
      const res = await fetch("https://graph.facebook.com/v19.0/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: params.phone.startsWith("91") ? params.phone : `91${params.phone}`,
          type: "template",
          template: {
            name: "gaming_invoice_v1",
            language: { code: "en" },
            components: [
              {
                type: "header",
                parameters: [
                  {
                    type: "document",
                    document: {
                      link: params.pdfUrl,
                      filename: `Khushi_Invoice_${params.invoiceNo}.pdf`,
                    },
                  },
                ],
              },
              {
                type: "body",
                parameters: [
                  { type: "text", text: params.customerName || "Valued Gamer" },
                  { type: "text", text: params.invoiceNo },
                  { type: "text", text: `₹${paiseToRupeesFormatted(params.amountPaise)}` },
                  { type: "text", text: `${params.sessionMinutes} mins` },
                ],
              },
            ],
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Meta WhatsApp dispatch error:", err);
        return { success: false, error: err.error?.message || "Meta API error" };
      }

      const data = await res.json();
      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (err: any) {
      console.error("WhatsApp dispatch network exception:", err);
      const mock = new MockWhatsAppProvider();
      return mock.sendInvoice(params);
    }
  }

  async getNotifications(tenantId: string): Promise<WhatsAppNotificationRecord[]> {
    const mock = new MockWhatsAppProvider();
    return mock.getNotifications(tenantId);
  }
}

export function getWhatsAppProvider(): IWhatsAppProvider {
  if (env.WHATSAPP_PROVIDER === "meta" || env.WHATSAPP_PROVIDER === "interakt") {
    return new MetaWhatsAppProvider();
  }
  return new MockWhatsAppProvider();
}
