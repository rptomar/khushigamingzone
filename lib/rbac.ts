export type Role =
  | "super_admin"
  | "reseller"
  | "owner"
  | "manager"
  | "receptionist"
  | "customer"
  | "device";

export type Permission =
  | "manage:platform"
  | "manage:resellers"
  | "manage:tenants"
  | "manage:outlets"
  | "manage:staff"
  | "manage:pricing"
  | "manage:devices"
  | "view:owner_dashboard"
  | "view:reports"
  | "view:audit_logs"
  | "manage:reception"
  | "start:session_manual"
  | "confirm:session_stop"
  | "mark:payment_paid"
  | "view:live_board"
  | "kiosk:operate"
  | "customer:play";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    "manage:platform",
    "manage:resellers",
    "manage:tenants",
    "manage:outlets",
    "manage:staff",
    "manage:pricing",
    "manage:devices",
    "view:owner_dashboard",
    "view:reports",
    "view:audit_logs",
    "manage:reception",
    "start:session_manual",
    "confirm:session_stop",
    "mark:payment_paid",
    "view:live_board",
  ],
  reseller: [
    "manage:platform",
    "manage:tenants",
    "view:owner_dashboard",
    "view:reports",
    "view:audit_logs",
  ],
  owner: [
    "manage:outlets",
    "manage:staff",
    "manage:pricing",
    "manage:devices",
    "view:owner_dashboard",
    "view:reports",
    "view:audit_logs",
    "manage:reception",
    "start:session_manual",
    "confirm:session_stop",
    "mark:payment_paid",
    "view:live_board",
  ],
  manager: [
    "manage:staff",
    "manage:pricing",
    "manage:devices",
    "view:owner_dashboard",
    "view:reports",
    "view:audit_logs",
    "manage:reception",
    "start:session_manual",
    "confirm:session_stop",
    "mark:payment_paid",
    "view:live_board",
  ],
  receptionist: [
    "manage:reception",
    "start:session_manual",
    "confirm:session_stop",
    "mark:payment_paid",
    "view:live_board",
  ],
  customer: ["customer:play"],
  device: ["kiosk:operate"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function canAccessPath(role: Role, pathname: string): boolean {
  if (role === "super_admin") return true;

  if (pathname.startsWith("/platform")) {
    return role === "reseller";
  }

  if (pathname.startsWith("/owner")) {
    return role === "owner" || role === "manager";
  }

  if (pathname.startsWith("/reception")) {
    return (
      role === "owner" ||
      role === "manager" ||
      role === "receptionist"
    );
  }

  if (pathname.startsWith("/kiosk")) {
    return true; // Devices authenticate via deviceToken
  }

  return true;
}
