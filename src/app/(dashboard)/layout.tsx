import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { DemoBanner } from "@/components/layout/demo-banner";
import { isDemoMode, DEMO_SESSION } from "@/lib/demo-mode";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDemo = await isDemoMode();

  let session;
  if (isDemo) {
    session = DEMO_SESSION;
  } else {
    session = await auth();
    if (!session) {
      redirect("/login");
    }
  }

  return (
    <SessionProvider session={session as any}>
      <div className="flex h-screen flex-col overflow-hidden">
        <DemoBanner isDemo={isDemo} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}
