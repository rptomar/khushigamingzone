import { NextRequest, NextResponse } from "next/server";
import { mockStore, DEFAULT_TENANT_ID } from "@/lib/db/mock-store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").toLowerCase();
    const status = searchParams.get("status");
    const tableId = searchParams.get("tableId");

    let sessions = mockStore.sessions.filter((s) => s.tenantId === DEFAULT_TENANT_ID);

    if (query) {
      sessions = sessions.filter(
        (s) =>
          s.customerPhone.toLowerCase().includes(query) ||
          s.customerName.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query)
      );
    }

    if (status && status !== "all") {
      sessions = sessions.filter((s) => s.status === status);
    }

    if (tableId && tableId !== "all") {
      sessions = sessions.filter((s) => s.resourceId === tableId);
    }

    // Sort newest first
    sessions.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    // Enrich with table name and invoice
    const enriched = sessions.map((s) => {
      const resource = mockStore.resources.find((r) => r.id === s.resourceId);
      const invoice = mockStore.invoices.find((i) => i.sessionId === s.id);
      
      const start = new Date(s.startedAt).getTime();
      const end = s.endedAt ? new Date(s.endedAt).getTime() : Date.now();
      const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

      return {
        ...s,
        tableName: resource?.name || "Table",
        typeCode: resource?.typeCode || "snooker",
        durationMinutes,
        invoiceId: invoice?.id,
        invoiceNo: invoice?.invoiceNo,
        invoiceStatus: invoice?.status || (s.status === "paid" ? "paid" : "pending"),
        totalPaise: invoice?.totalPaise || s.amountPaise || 0,
      };
    });

    return NextResponse.json({ sessions: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

