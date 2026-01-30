import { vi } from 'vitest';

export const mockIsDemoMode = vi.fn(() => Promise.resolve(false));

vi.mock('@/lib/demo-mode', () => ({
  isDemoMode: mockIsDemoMode,
  DEMO_SESSION: {
    user: {
      id: 'demo-user-id',
      name: 'Demo User',
      email: 'demo@example.com',
      image: null,
      role: 'ADMIN',
      organizationId: 'demo-org-id',
    },
    expires: '2099-12-31T23:59:59.999Z',
  },
}));
