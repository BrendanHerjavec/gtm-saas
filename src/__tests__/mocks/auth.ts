import { vi } from 'vitest';

export const mockAuthSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'ADMIN',
    organizationId: 'test-org-id',
    image: null,
  },
  expires: '2099-12-31T23:59:59.999Z',
};

export const mockMemberSession = {
  user: {
    id: 'test-member-id',
    email: 'member@example.com',
    name: 'Test Member',
    role: 'MEMBER',
    organizationId: 'test-org-id',
    image: null,
  },
  expires: '2099-12-31T23:59:59.999Z',
};

export const mockGetAuthSession = vi.fn();
export const mockHashPassword = vi.fn((password: string) =>
  Promise.resolve(`hashed_${password}`)
);
export const mockVerifyPassword = vi.fn((password: string, hash: string) =>
  Promise.resolve(hash === `hashed_${password}`)
);

vi.mock('@/lib/auth', () => ({
  getAuthSession: mockGetAuthSession,
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
}));
