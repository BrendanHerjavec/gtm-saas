import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

// Mock session for development - skip auth
const mockSession = {
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

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Skip auth check for demo purposes
  const session = mockSession as any;

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
