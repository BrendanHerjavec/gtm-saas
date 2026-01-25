import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In demo mode, always redirect to dashboard
  redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
