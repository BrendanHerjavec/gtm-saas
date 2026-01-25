import type { CRMAdapter, CRMProvider } from "./types";
import { hubspotAdapter } from "./hubspot";
import { salesforceAdapter } from "./salesforce";
import { attioAdapter } from "./attio";

export * from "./types";
export { hubspotAdapter } from "./hubspot";
export { salesforceAdapter } from "./salesforce";
export { attioAdapter } from "./attio";

const adapters: Record<CRMProvider, CRMAdapter> = {
  hubspot: hubspotAdapter,
  salesforce: salesforceAdapter,
  attio: attioAdapter,
};

export function getProviderAdapter(provider: CRMProvider): CRMAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`Unknown CRM provider: ${provider}`);
  }
  return adapter;
}

export function isValidProvider(provider: string): provider is CRMProvider {
  return ["hubspot", "salesforce", "attio"].includes(provider);
}
