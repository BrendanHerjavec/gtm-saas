"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  RefreshCw,
  Unplug,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { triggerSync, disconnectIntegration } from "@/actions/integrations";
import type { IntegrationStatus } from "@/actions/integrations";

const providerConfig: Record<string, { name: string; icon: string; color: string; url: string }> = {
  hubspot: {
    name: "HubSpot",
    icon: "H",
    color: "bg-orange-500",
    url: "https://app.hubspot.com",
  },
  salesforce: {
    name: "Salesforce",
    icon: "SF",
    color: "bg-blue-500",
    url: "https://login.salesforce.com",
  },
  attio: {
    name: "Attio",
    icon: "A",
    color: "bg-purple-500",
    url: "https://app.attio.com",
  },
};

interface ConnectedIntegrationProps {
  integration: IntegrationStatus;
}

export function ConnectedIntegration({ integration }: ConnectedIntegrationProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = providerConfig[integration.provider || "hubspot"];

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const result = await triggerSync();
      if (!result.success) {
        setError(result.error || "Sync failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const result = await disconnectIntegration();
      if (!result.success) {
        setError(result.error || "Disconnect failed");
      }
      setShowDisconnect(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const statusIcon = {
    CONNECTED: <CheckCircle className="h-5 w-5 text-green-500" />,
    SYNCING: <Loader2 className="h-5 w-5 animate-spin text-blue-500" />,
    ERROR: <AlertCircle className="h-5 w-5 text-red-500" />,
    DISCONNECTED: <AlertCircle className="h-5 w-5 text-gray-500" />,
  }[integration.status || "CONNECTED"];

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${config.color} text-white font-bold text-lg`}
              >
                {config.icon}
              </div>
              <div>
                <CardTitle className="text-xl">{config.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {statusIcon}
                  <span className="text-sm text-muted-foreground capitalize">
                    {integration.status?.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {integration.isDemo && (
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 border-purple-200">
                  Demo
                </Badge>
              )}
              <Badge className="bg-green-500/10 text-green-600 border-green-200">
                Connected
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sync status */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Last synced</span>
              <p className="font-medium">{formatDate(integration.lastSyncAt)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last sync status</span>
              <p className="font-medium capitalize">
                {integration.lastSyncStatus?.toLowerCase() || "—"}
              </p>
            </div>
          </div>

          {/* Error message */}
          {(integration.lastSyncError || error) && (
            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-md text-sm text-red-600 dark:text-red-400">
              {error || integration.lastSyncError}
            </div>
          )}

          {/* Recent sync activity */}
          {integration.recentSyncLogs && integration.recentSyncLogs.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent Activity</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {integration.recentSyncLogs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0"
                  >
                    <span className="capitalize text-muted-foreground">
                      {log.operation.replace("_", " ")} • {log.entityType}
                    </span>
                    <span>
                      {log.recordsProcessed} records
                      {log.recordsFailed > 0 && (
                        <span className="text-red-500 ml-1">
                          ({log.recordsFailed} failed)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSync}
              disabled={isSyncing || integration.status === "SYNCING"}
            >
              {isSyncing || integration.status === "SYNCING" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync Now
            </Button>
            <Button variant="outline" asChild>
              <a href={config.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open {config.name}
              </a>
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setShowDisconnect(true)}
            >
              <Unplug className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {config.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop syncing data from your CRM. Your existing data will
              be preserved but will no longer receive updates from {config.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDisconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
