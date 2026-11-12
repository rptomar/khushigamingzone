import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token parameter" }, { status: 400 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const fullKioskUrl = `${protocol}://${host}/kiosk/${token}`;

    const qrDataUrl = await QRCode.toDataURL(fullKioskUrl, {
      margin: 2,
      width: 320,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      token,
      fullKioskUrl,
      qrDataUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate QR" }, { status: 500 });
  }
}
