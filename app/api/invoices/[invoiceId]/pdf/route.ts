import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { InvoiceDocument, InvoicePdfData } from "@/lib/pdf/invoice-template";
import { mockStore } from "@/lib/db/mock-store";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;

    // Check mock store or DB
    const invoice = mockStore.invoices.find(
      (inv) => inv.id === invoiceId || inv.invoiceNo === invoiceId
    );

    const session = invoice
      ? mockStore.sessions.find((s) => s.id === invoice.sessionId)
      : null;

    const resource = session
      ? mockStore.resources.find((r) => r.id === session.resourceId)
      : mockStore.resources[0];

    const customer = session
      ? mockStore.customers.find((c) => c.id === session.customerId)
      : mockStore.customers[0];

    const startedAtDate = session?.startedAt
      ? new Date(session.startedAt)
      : new Date(Date.now() - 3600000);
    const endedAtDate = session?.endedAt ? new Date(session.endedAt) : new Date();

    const durationMinutes = Math.max(
      15,
      Math.round((endedAtDate.getTime() - startedAtDate.getTime()) / 60000)
    );

    const subtotalPaise = invoice?.subtotalPaise || 40000;
    const gstPaise = invoice?.gstPaise || Math.round(subtotalPaise * 0.18);
    const totalPaise = invoice?.totalPaise || subtotalPaise + gstPaise;

    const invoiceData: InvoicePdfData = {
      invoiceNo: invoice?.invoiceNo || invoiceId || "KGZ-2026-0042",
      issueDate: invoice?.createdAt
        ? new Date(invoice.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
      tenantName: "Ps07 Gaming Arena",
      outletName: "Main Gaming Arena - Nexus Mall",
      gstin: "07AAACK1234F1Z8",
      upiVpa: "ps07gaming@okaxis",
      customerPhone: customer?.phone || "9876543210",
      customerName: customer?.name || "VIP Gamer",
      tableName: resource?.name || "Table 1 - Riley Aristocrat Snooker",
      resourceTypeName: resource?.typeCode || "snooker",
      startedAt: startedAtDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      endedAt: endedAtDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      durationMinutes,
      planName: "Hourly Standard Plan",
      rateDescription: "₹350 / hour (pro-rata 15m increment)",
      subtotalPaise,
      gstPaise,
      totalPaise,
      paymentMethod: invoice?.status === "paid" ? "upi" : "cash",
      paymentRef: `UPI-RR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: invoice?.status === "paid" ? "paid" : "issued",
    };

    const pdfBuffer = await renderToBuffer(
      (React.createElement(InvoiceDocument, { data: invoiceData }) as any)
    );

    return new Response(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Invoice_${invoiceData.invoiceNo}.pdf"`,
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("Failed to generate PDF invoice:", error);
    return NextResponse.json(
      { error: "Failed to render invoice PDF", details: error.message },
      { status: 500 }
    );
  }
}
