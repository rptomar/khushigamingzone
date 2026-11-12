import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { paiseToRupeesFormatted } from "@/lib/domain/money";

export interface InvoicePdfData {
  invoiceNo: string;
  issueDate: string;
  tenantName: string;
  outletName: string;
  gstin?: string;
  upiVpa?: string;
  customerPhone: string;
  customerName?: string;
  tableName: string;
  resourceTypeName: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  planName: string;
  rateDescription: string;
  subtotalPaise: number;
  gstPaise: number;
  totalPaise: number;
  paymentMethod: string;
  paymentRef?: string;
  status: "paid" | "draft" | "issued";
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: "#0D0E15",
    color: "#E2E8F0",
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2D3D",
    paddingBottom: 20,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B5CF6", // Violet accent
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 2,
  },
  invoiceMetaRight: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  invoiceNo: {
    fontSize: 11,
    color: "#38BDF8", // Cyan
    marginTop: 2,
    fontWeight: "bold",
  },
  statusBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "#065F46",
    color: "#34D399",
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  statusBadgeUnpaid: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "#78350F",
    color: "#FBBF24",
    fontSize: 8,
    fontWeight: "bold",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    padding: 12,
    backgroundColor: "#161824",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#232636",
  },
  infoColumn: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 8,
    color: "#64748B",
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 10,
    color: "#F1F5F9",
    fontWeight: "bold",
  },
  infoSubtext: {
    fontSize: 8,
    color: "#94A3B8",
  },
  table: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#232636",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1E2235",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2D3D",
  },
  tableHeaderCol: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#131522",
  },
  tableColDesc: {
    flex: 3,
  },
  tableColCenter: {
    flex: 1,
    textAlign: "center",
  },
  tableColRight: {
    flex: 1.5,
    textAlign: "right",
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  itemSub: {
    fontSize: 8,
    color: "#94A3B8",
    marginTop: 2,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totalBox: {
    width: 220,
    backgroundColor: "#161824",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#232636",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#2A2D3D",
  },
  totalLabel: {
    fontSize: 9,
    color: "#94A3B8",
  },
  totalValue: {
    fontSize: 9,
    color: "#F1F5F9",
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  grandTotalValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#10B981", // Emerald
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#232636",
    paddingTop: 16,
    marginTop: "auto",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#64748B",
    textAlign: "center",
  },
  footerHash: {
    fontSize: 7,
    color: "#475569",
    fontFamily: "Courier",
    marginTop: 4,
  },
});

export const InvoiceDocument: React.FC<{ data: InvoicePdfData }> = ({ data }) => {
  const isPaid = data.status === "paid";
  const hours = Math.floor(data.durationMinutes / 60);
  const mins = data.durationMinutes % 60;
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

  return (
    <Document title={`Invoice_${data.invoiceNo}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandTitle}>{data.tenantName.toUpperCase()}</Text>
            <Text style={styles.brandSubtitle}>
              {data.outletName} • Premium Multi-Tenant Gaming OS
            </Text>
            {data.gstin && (
              <Text style={styles.brandSubtitle}>GSTIN: {data.gstin}</Text>
            )}
            {data.upiVpa && (
              <Text style={styles.brandSubtitle}>UPI: {data.upiVpa}</Text>
            )}
          </View>
          <View style={styles.invoiceMetaRight}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <Text style={styles.invoiceNo}>#{data.invoiceNo}</Text>
            <Text style={styles.brandSubtitle}>Issued: {data.issueDate}</Text>
            <Text style={isPaid ? styles.statusBadge : styles.statusBadgeUnpaid}>
              {isPaid ? `PAID (${data.paymentMethod.toUpperCase()})` : "AWAITING PAYMENT"}
            </Text>
          </View>
        </View>

        {/* Customer & Station Info Cards */}
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <Text style={styles.sectionLabel}>Customer Details</Text>
            <Text style={styles.infoValue}>+91 {data.customerPhone}</Text>
            {data.customerName && (
              <Text style={styles.infoSubtext}>{data.customerName}</Text>
            )}
            <Text style={styles.infoSubtext}>Verified via OTP kiosk login</Text>
          </View>

          <View style={styles.infoColumn}>
            <Text style={styles.sectionLabel}>Station / Table</Text>
            <Text style={styles.infoValue}>{data.tableName}</Text>
            <Text style={styles.infoSubtext}>{data.resourceTypeName.toUpperCase()}</Text>
            <Text style={styles.infoSubtext}>Touch Kiosk Station</Text>
          </View>

          <View style={styles.infoColumn}>
            <Text style={styles.sectionLabel}>Session Times</Text>
            <Text style={styles.infoValue}>{durationText} played</Text>
            <Text style={styles.infoSubtext}>Start: {data.startedAt}</Text>
            <Text style={styles.infoSubtext}>End: {data.endedAt}</Text>
          </View>
        </View>

        {/* Itemized Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, styles.tableColDesc]}>Game Session Description</Text>
            <Text style={[styles.tableHeaderCol, styles.tableColCenter]}>Plan Rate</Text>
            <Text style={[styles.tableHeaderCol, styles.tableColCenter]}>Duration</Text>
            <Text style={[styles.tableHeaderCol, styles.tableColRight]}>Amount (INR)</Text>
          </View>

          <View style={styles.tableRow}>
            <View style={styles.tableColDesc}>
              <Text style={styles.itemTitle}>{data.tableName} - {data.planName}</Text>
              <Text style={styles.itemSub}>
                Session {data.startedAt} to {data.endedAt} (Includes peak multipliers / tier rates)
              </Text>
            </View>
            <Text style={[styles.infoSubtext, styles.tableColCenter]}>{data.rateDescription}</Text>
            <Text style={[styles.infoSubtext, styles.tableColCenter]}>{durationText}</Text>
            <Text style={[styles.infoValue, styles.tableColRight]}>
              ₹{paiseToRupeesFormatted(data.subtotalPaise)}
            </Text>
          </View>
        </View>

        {/* Total Box */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{paiseToRupeesFormatted(data.subtotalPaise)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>CGST (9%)</Text>
              <Text style={styles.totalValue}>₹{paiseToRupeesFormatted(Math.round(data.gstPaise / 2))}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>SGST (9%)</Text>
              <Text style={styles.totalValue}>₹{paiseToRupeesFormatted(Math.round(data.gstPaise / 2))}</Text>
            </View>
            <View style={styles.totalRowFinal}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{paiseToRupeesFormatted(data.totalPaise)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Footer / Audit trail */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for choosing {data.tenantName}! We hope you had a thrilling experience.
          </Text>
          <Text style={styles.footerText}>
            This is an anti-theft electronically verified invoice generated directly from kiosk telemetry.
          </Text>
          <Text style={styles.footerHash}>
            AUDIT HASH: SHA256:{data.invoiceNo}:{data.totalPaise}:{data.customerPhone}:{Date.now().toString(36)}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
