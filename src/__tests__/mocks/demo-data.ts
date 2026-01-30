import { vi } from 'vitest';

// Mock demo-data module to avoid importing heavy demo fixtures
vi.mock('@/lib/demo-data', () => ({
  demoRecipients: [],
  demoSends: [],
  demoGiftItems: [],
  demoCampaigns: [],
  demoBudgets: [],
  demoOutreachTasks: [],
  DEMO_USER_ID: 'demo-user-id',
  DEMO_ORG_ID: 'demo-org-id',
}));
