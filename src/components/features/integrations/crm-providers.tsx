"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles } from "lucide-react";
import { connectDemoIntegration } from "@/actions/integrations";

const crmProviders = [
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Sync contacts, companies, and deals from HubSpot CRM",
    icon: "H",
    color: "bg-green-800",
    popular: true,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Connect to Salesforce for leads, contacts, accounts, and opportunities",
    icon: "SF",
    color: "bg-blue-500",
    popular: true,
  },
  {
    id: "attio",
    name: "Attio",
    description: "Sync people, companies, and deals from Attio",
    icon: "A",
    color: "bg-purple-500",
    popular: false,
  },
];

export function CRMProviders() {
  const router = useRouter();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Demo mode - use demo connection instead of OAuth
  const DEMO_MODE = true;

  const handleConnect = async (providerId: string) => {
    setError(null);

    if (DEMO_MODE) {
      // Use demo connection
      setConnecting(providerId);
      try {
        const result = await connectDemoIntegration(
          providerId as "hubspot" | "salesforce" | "attio"
        );
        if (result.success) {
          router.refresh();
        } else {
          setError(result.error || "Connection failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed");
      } finally {
        setConnecting(null);
      }
    } else {
      // Real OAuth flow
      window.location.href = `/api/integrations/${providerId}/authorize`;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Connect Your CRM</h2>
          {DEMO_MODE && (
            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-200">
              <Sparkles className="h-3 w-3 mr-1" />
              Demo Mode
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {DEMO_MODE
            ? "Try the integration with sample data. No CRM credentials needed."
            : "Choose your CRM to sync leads, contacts, companies, and deals automatically."}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-md text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {crmProviders.map((provider) => (
          <Card key={provider.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${provider.color} text-white font-bold`}
                >
                  {provider.icon}
                </div>
                {provider.popular && (
                  <Badge variant="secondary" className="text-xs">
                    Popular
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <h3 className="font-semibold">{provider.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {provider.description}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleConnect(provider.id)}
                disabled={connecting !== null}
              >
                {connecting === provider.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    {DEMO_MODE ? "Try " : "Connect "}
                    {provider.name}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-4">
        {DEMO_MODE
          ? "Demo connections include sample leads, contacts, companies, and deals."
          : "Only one CRM can be connected per organization. Your data will sync automatically."}
      </p>
    </div>
  );
}
