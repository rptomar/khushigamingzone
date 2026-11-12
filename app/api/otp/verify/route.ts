import { NextResponse } from "next/server";
import { z } from "zod";
import { getOtpProvider } from "@/lib/providers/otp";

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
  tenantId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = verifyOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid OTP request parameters" },
        { status: 400 }
      );
    }

    const provider = getOtpProvider();
    const result = await provider.verifyOtp(
      parsed.data.phone,
      parsed.data.code,
      parsed.data.tenantId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Phone verified successfully",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}

