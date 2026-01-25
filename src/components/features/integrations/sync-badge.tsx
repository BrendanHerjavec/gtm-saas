"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ExternalLink, RefreshCw, AlertTriangle, Check, Cloud } from "lucide-react";

interface SyncBadgeProps {
  externalSource: string | null | undefined;
  externalUrl: string | null | undefined;
  syncStatus: string | null | undefined;
  lastSyncedAt: Date | string | null | undefined;
}

const providerNames: Record<string, string> = {
  hubspot: "HubSpot",
  salesforce: "Salesforce",
  attio: "Attio",
};

export function SyncBadge({
  externalSource,
  externalUrl,
  syncStatus,
  lastSyncedAt,
}: SyncBadgeProps) {
  // If no external source, show local badge
  if (!externalSource) {
    return (
      <Badge variant="outline" className="text-xs">
        Local
      </Badge>
    );
  }

  const statusConfig = {
    SYNCED: {
      icon: Check,
      color: "text-green-600",
      bg: "bg-green-500/10 border-green-200",
      label: "Synced",
    },
    PENDING: {
      icon: RefreshCw,
      color: "text-yellow-600",
      bg: "bg-yellow-500/10 border-yellow-200",
      label: "Pending",
    },
    ERROR: {
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-500/10 border-red-200",
      label: "Error",
    },
  }[syncStatus || "SYNCED"] || {
    icon: Cloud,
    color: "text-blue-600",
    bg: "bg-blue-500/10 border-blue-200",
    label: "Synced",
  };

  const StatusIcon = statusConfig.icon;
  const providerName = providerNames[externalSource] || externalSource;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Never";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Badge
              variant="outline"
              className={`${statusConfig.bg} ${statusConfig.color} gap-1 text-xs`}
            >
              <StatusIcon className="h-3 w-3" />
              <span>{providerName}</span>
            </Badge>
            {externalUrl && (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-medium">Synced from {providerName}</p>
            <p className="text-muted-foreground">
              Last synced: {formatDate(lastSyncedAt)}
            </p>
            {syncStatus === "PENDING" && (
              <p className="text-yellow-600 mt-1">Changes pending sync</p>
            )}
            {syncStatus === "ERROR" && (
              <p className="text-red-600 mt-1">Sync error occurred</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
