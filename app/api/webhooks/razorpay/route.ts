import { NextRequest, NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/providers/payment";
import { getWhatsAppProvider } from "@/lib/providers/whatsapp";
import { mockStore } from "@/lib/db/mock-store";
import { env } from "@/lib/validation/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const paymentProvider = getPaymentProvider();
    const verification = await paymentProvider.verifyWebhook(rawBody, signature);

    if (!verification.verified) {
      console.warn("Razorpay Webhook verification failed:", verification.error);
      return NextResponse.json(
        { error: "Invalid webhook signature", details: verification.error },
        { status: 400 }
      );
    }

    const { invoiceId, paymentId, amountPaise, method } = verification;

    if (!invoiceId) {
      // General Razorpay event (not tied to invoice)
      return NextResponse.json({ status: "acknowledged" });
    }

    // Lookup invoice
    const invoice = mockStore.invoices.find(
      (inv) => inv.id === invoiceId || inv.invoiceNo === invoiceId
    );

    if (!invoice) {
      console.warn(`Webhook received for unknown invoice: ${invoiceId}`);
      return NextResponse.json({ status: "invoice_not_found" }, { status: 404 });
    }

    // Idempotency check: if already paid, return early
    if (invoice.status === "paid") {
      return NextResponse.json({
        status: "ok",
        message: "Invoice already marked as paid",
      });
    }

    // Mark invoice as paid
    invoice.status = "paid";

    // Find session and customer
    const session = mockStore.sessions.find((s) => s.id === invoice.sessionId);
    const customer = session
      ? mockStore.customers.find((c) => c.id === session.customerId)
      : null;

    if (session) {
      session.status = "paid";
      session.endedAt = session.endedAt || new Date().toISOString();

      // Free up resource
      const resource = mockStore.resources.find((r) => r.id === session.resourceId);
      if (resource) {
        resource.status = "available";
      }

      // Append session event
      mockStore.sessionEvents.push({
        id: `ev_${Date.now()}_paid`,
        sessionId: session.id,
        eventType: "stop_confirmed",
        actorRole: "system",
        actorId: "razorpay_webhook",
        note: `Paid ₹${((amountPaise || invoice.totalPaise) / 100).toFixed(2)} via UPI (${paymentId})`,
        createdAt: new Date().toISOString(),
      });
    }

    // Record payment
    const paymentRecord = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId: invoice.tenantId,
      invoiceId: invoice.id,
      amountPaise: amountPaise || invoice.totalPaise,
      method: (method as "upi" | "cash" | "card" | "membership" | "wallet") || "upi",
      status: "completed" as const,
      providerRef: paymentId || `pay_${Date.now()}`,
      receivedBy: "online_webhook",
      createdAt: new Date().toISOString(),
    };
    mockStore.payments.push(paymentRecord);

    // Audit log
    mockStore.auditLogs.push({
      id: `audit_${Date.now()}`,
      tenantId: invoice.tenantId,
      actorId: "razorpay_webhook",
      actorName: "Razorpay Webhook",
      actorRole: "system",
      action: "payment_received",
      entity: "invoice",
      entityId: invoice.id,
      reason: `Webhook payment ₹${((paymentRecord.amountPaise) / 100).toFixed(2)} received (${paymentId})`,
      createdAt: new Date().toISOString(),
    });

    // Dispatch WhatsApp invoice
    if (customer?.phone) {
      const whatsapp = getWhatsAppProvider();
      const pdfUrl = `${env.APP_URL}/api/invoices/${invoice.id}/pdf`;
      const sessionMinutes = session?.startedAt && session?.endedAt
        ? Math.round(
            (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
          )
        : 60;

      whatsapp.sendInvoice({
        tenantId: invoice.tenantId,
        phone: customer.phone,
        customerName: customer.name,
        invoiceNo: invoice.invoiceNo,
        amountPaise: invoice.totalPaise,
        pdfUrl,
        sessionMinutes,
      }).catch((err) => {
        console.error("Async WhatsApp invoice dispatch error:", err);
      });
    }

    return NextResponse.json({
      status: "success",
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      paymentId,
    });
  } catch (error: any) {
    console.error("Razorpay webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook internal failure", details: error.message },
      { status: 500 }
    );
  }
}
