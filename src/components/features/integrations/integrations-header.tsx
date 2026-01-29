import { Plug } from "lucide-react";

export function IntegrationsHeader() {
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Plug className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
      </div>
      <p className="mt-2 text-muted-foreground">
        Sync recipients from your CRM so you can start sending gifts and personal
        touches right away.
      </p>
    </div>
  );
}
