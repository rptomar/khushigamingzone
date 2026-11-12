import { NextResponse } from "next/server";
import { z } from "zod";
import { getOtpProvider } from "@/lib/providers/otp";

const requestOtpSchema = z.object({
  phone: z.string().min(10).max(15).regex(/^[0-9]+$/, "Phone must contain only digits"),
  tenantId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    const provider = getOtpProvider();
    const result = await provider.sendOtp(parsed.data.phone, parsed.data.tenantId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 429 });
    }

    return NextResponse.json({
      success: true,
      devOtp: result.devOtp,
      message: "OTP sent successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}

