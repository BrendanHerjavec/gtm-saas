import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo-mode";
import { auth } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If already logged in or in demo mode, redirect to dashboard
  const isDemo = await isDemoMode();
  if (isDemo) {
    redirect("/dashboard");
  }

  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
