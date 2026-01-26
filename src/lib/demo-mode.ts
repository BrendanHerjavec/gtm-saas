import { cookies } from "next/headers";

const DEMO_MODE_COOKIE = "demo_mode";

export async function isDemoMode(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(DEMO_MODE_COOKIE)?.value === "true";
  } catch {
    return false;
  }
}

export const DEMO_SESSION = {
  user: {
    id: "demo-user-id",
    name: "Demo User",
    email: "demo@example.com",
    image: null,
    role: "ADMIN",
    organizationId: "demo-org-id",
  },
  expires: "2099-12-31T23:59:59.999Z",
};
