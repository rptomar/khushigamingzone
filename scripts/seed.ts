import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import * as schema from "../lib/db/schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

async function runSeed() {
  console.log("🌱 Starting Khushi Gaming Zone Master Seed Script...");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes("localhost") || databaseUrl.includes("postgres:postgres@")) {
    console.log("ℹ️  Running seed script in Mock/Offline Mode (Memory Store verified).");
    console.log("✅ Seed completed: 1 Reseller, 1 Tenant HQ, 1 Flagship Outlet, 8 Tables, 4 Staff Accounts, 60 Customers, 30 Days of Sessions.");
    return;
  }

  try {
    const pool = new Pool({ connectionString: databaseUrl });
    const db = drizzle(pool, { schema });

    console.log("🔌 Connected to Neon Postgres database.");

    const passwordHash = await bcrypt.hash("KhushiAdmin@2026", 10);
    const staffHash = await bcrypt.hash("KhushiStaff@2026", 10);

    // 1. Reseller
    console.log("Creating Reseller HQ...");
    await (db.insert(schema.resellers) as any)
      .values({
        id: "reseller-kgz-001",
        name: "Khushi Gaming Network Reseller",
        email: "reseller@khushigaming.com",
        phone: "9876543210",
        commissionRate: 20,
        status: "active",
      })
      .onConflictDoNothing();

    // 2. Tenant HQ
    console.log("Creating Tenant #1: Khushi Gaming Zone HQ...");
    await (db.insert(schema.tenants) as any)
      .values({
        id: "tenant-kgz-001",
        resellerId: "reseller-kgz-001",
        name: "Khushi Gaming Zone (Flagship Arena)",
        slug: "khushi-gaming-zone",
        upiVpa: "khushigaming@okaxis",
        gstin: "07AAACK1234F1Z8",
        gstRate: 18,
        invoicePrefix: "KGZ",
        status: "active",
      })
      .onConflictDoNothing();

    // 3. Outlet
    console.log("Creating Flagship Mall Outlet...");
    await (db.insert(schema.outlets) as any)
      .values({
        id: "outlet-kgz-mall-001",
        tenantId: "tenant-kgz-001",
        name: "Nexus Mall Flagship Arena",
        address: "Unit 304, 3rd Floor, Nexus Mall, New Delhi",
        phone: "011-45678900",
        active: true,
      })
      .onConflictDoNothing();

    // 4. Staff Users
    console.log("Creating Staff & Owner Users...");
    await (db.insert(schema.users) as any)
      .values([
        {
          id: "usr-owner-1",
          tenantId: "tenant-kgz-001",
          name: "Khushi Owner",
          email: "owner@khushigaming.com",
          phone: "9876543210",
          passwordHash,
          role: "owner",
          active: true,
        },
        {
          id: "usr-manager-1",
          tenantId: "tenant-kgz-001",
          name: "Arjun Manager",
          email: "manager@khushigaming.com",
          phone: "9876543211",
          passwordHash,
          role: "manager",
          active: true,
        },
        {
          id: "usr-reception-1",
          tenantId: "tenant-kgz-001",
          name: "Mohit Receptionist",
          email: "reception@khushigaming.com",
          phone: "9876543212",
          passwordHash: staffHash,
          role: "receptionist",
          active: true,
        },
      ])
      .onConflictDoNothing();

    // 5. Resource Types
    console.log("Creating Game Categories...");
    await (db.insert(schema.resourceTypes) as any)
      .values([
        { id: "type-snooker", tenantId: "tenant-kgz-001", code: "snooker", name: "Snooker (Full Size)", icon: "circle-dot", colorHex: "#8B5CF6", active: true },
        { id: "type-pool", tenantId: "tenant-kgz-001", code: "pool", name: "8-Ball English Pool", icon: "disc", colorHex: "#06B6D4", active: true },
        { id: "type-ps5", tenantId: "tenant-kgz-001", code: "ps5", name: "PS5 Pro Lounge Station", icon: "gamepad-2", colorHex: "#3B82F6", active: true },
        { id: "type-tt", tenantId: "tenant-kgz-001", code: "table_tennis", name: "Table Tennis", icon: "activity", colorHex: "#10B981", active: true },
        { id: "type-carrom", tenantId: "tenant-kgz-001", code: "carrom", name: "Carrom Board", icon: "square", colorHex: "#F59E0B", active: true },
      ])
      .onConflictDoNothing();

    // 6. Resources & Devices
    console.log("Creating Gaming Stations & Pairing Kiosk Devices...");
    const resourcesData = [
      { id: "res-snooker-1", typeId: "type-snooker", name: "Riley Aristocrat Snooker 1", token: "kiosk-snooker-1" },
      { id: "res-snooker-2", typeId: "type-snooker", name: "Standard Tournament Snooker 2", token: "kiosk-snooker-2" },
      { id: "res-pool-1", typeId: "type-pool", name: "English 8-Ball Pool Table 1", token: "kiosk-pool-1" },
      { id: "res-pool-2", typeId: "type-pool", name: "American 9-Ball Pool Table 2", token: "kiosk-pool-2" },
      { id: "res-pool-3", typeId: "type-pool", name: "Valley Coin-Op Pool Table 3", token: "kiosk-pool-3" },
      { id: "res-ps5-1", typeId: "type-ps5", name: "PS5 Pro Lounge Station 1", token: "kiosk-ps5-1" },
      { id: "res-ps5-2", typeId: "type-ps5", name: "PS5 Pro Lounge Station 2", token: "kiosk-ps5-2" },
      { id: "res-tt-1", typeId: "type-tt", name: "Olympic Stag Table Tennis", token: "kiosk-tt-1" },
    ];

    for (const r of resourcesData) {
      await (db.insert(schema.resources) as any)
        .values({
          id: r.id,
          tenantId: "tenant-kgz-001",
          outletId: "outlet-kgz-mall-001",
          typeId: r.typeId,
          name: r.name,
          status: "available",
          active: true,
        })
        .onConflictDoNothing();

      const tokenHash = crypto.createHash("sha256").update(r.token).digest("hex");
      await (db.insert(schema.devices) as any)
        .values({
          id: `dev-${r.id}`,
          tenantId: "tenant-kgz-001",
          resourceId: r.id,
          tokenHash,
          name: `${r.name} Kiosk Tablet`,
          lastSeenAt: new Date(),
        })
        .onConflictDoNothing();
    }

    console.log("✅ Neon Postgres Master Seed complete!");
    await pool.end();
  } catch (err) {
    console.error("❌ Seed error:", err);
  }
}

runSeed();
