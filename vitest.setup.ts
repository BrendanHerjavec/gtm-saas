import { vi, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Mock Next.js server-only module
vi.mock('server-only', () => ({}));

// Mock next/cache globally
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Clear all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});
