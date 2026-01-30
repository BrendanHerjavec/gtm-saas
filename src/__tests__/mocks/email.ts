import { vi } from 'vitest';

export const mockSendEmail = vi.fn(() =>
  Promise.resolve({ success: true, messageId: 'mock-message-id' })
);

vi.mock('@/lib/email', () => ({
  sendEmail: mockSendEmail,
}));
