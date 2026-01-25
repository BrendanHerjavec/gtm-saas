import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "Reset email sent if account exists" });
    }

    // TODO: Implement actual password reset email sending
    // For now, we'll create a verification token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // TODO: Send email with reset link containing token
    // In production, integrate with an email service like Resend, SendGrid, etc.
    console.log(`Password reset token for ${email}: ${token}`);

    return NextResponse.json({ message: "Reset email sent if account exists" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
