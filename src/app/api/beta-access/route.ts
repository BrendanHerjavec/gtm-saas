import { NextResponse } from "next/server";

const BETA_PASSWORD = process.env.BETA_PASSWORD || "juniply2025";

export async function POST(request: Request) {
  const body = await request.json();
  const { password } = body;

  if (password === BETA_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("beta_access", "granted", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      // 30 days
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return response;
  }

  return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
}
