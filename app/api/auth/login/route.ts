import { NextResponse } from "next/server";
import { z } from "zod";
import { signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import type { Role } from "@/lib/rbac";
import { DEFAULT_TENANT_ID, DEFAULT_OUTLET_ID } from "@/lib/db/mock-store";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

const DEMO_USERS: Record<
  string,
  {
    id: string;
    name: string;
    role: Role;
    tenantId: string;
    outletIds: string[];
    password: string;
  }
> = {
  "superadmin@khushigaming.com": {
    id: "usr-admin-0",
    name: "Platform Super Admin",
    role: "super_admin",
    tenantId: DEFAULT_TENANT_ID,
    outletIds: [DEFAULT_OUTLET_ID],
    password: "admin123",
  },
  "owner@khushigaming.com": {
    id: "usr-owner-1",
    name: "Khushi Owner (Vikram)",
    role: "owner",
    tenantId: DEFAULT_TENANT_ID,
    outletIds: [DEFAULT_OUTLET_ID],
    password: "owner123",
  },
  "manager@khushigaming.com": {
    id: "usr-manager-1",
    name: "Sanjay Manager",
    role: "manager",
    tenantId: DEFAULT_TENANT_ID,
    outletIds: [DEFAULT_OUTLET_ID],
    password: "manager123",
  },
  "reception@khushigaming.com": {
    id: "usr-staff-1",
    name: "Ramesh Receptionist",
    role: "receptionist",
    tenantId: DEFAULT_TENANT_ID,
    outletIds: [DEFAULT_OUTLET_ID],
    password: "reception123",
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials format" }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = DEMO_USERS[email.toLowerCase()];

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signSessionToken({
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId,
      outletIds: user.outletIds,
      name: user.name,
      email: email.toLowerCase(),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });

    // Set secure httpOnly cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}

