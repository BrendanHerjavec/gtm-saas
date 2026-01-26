"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const DEMO_MODE_COOKIE = "demo_mode";

export async function enterDemoMode() {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_MODE_COOKIE, "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  redirect("/dashboard");
}

export async function exitDemoMode() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_MODE_COOKIE);
  redirect("/login");
}
