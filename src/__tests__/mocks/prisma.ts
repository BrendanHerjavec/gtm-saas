import { vi } from 'vitest';

// Helper to create a mock model with standard Prisma methods
function createMockModel() {
  return {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
    upsert: vi.fn(),
  };
}

export const mockPrisma = {
  user: createMockModel(),
  organization: createMockModel(),
  recipient: createMockModel(),
  send: createMockModel(),
  outreachTask: createMockModel(),
  budget: createMockModel(),
  campaign: createMockModel(),
  giftItem: createMockModel(),
  giftCategory: createMockModel(),
  taskDeck: createMockModel(),
  campaignStep: createMockModel(),
  campaignRecipient: createMockModel(),
  gesture: createMockModel(),
  activity: createMockModel(),
  vendor: createMockModel(),
  campaignStats: createMockModel(),
  cRMIntegration: createMockModel(),
  syncLog: createMockModel(),
  $transaction: vi.fn((callback: any) => callback(mockPrisma)),
};

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));
