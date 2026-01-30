import { describe, it, expect, beforeEach } from 'vitest';
import { revalidatePath } from 'next/cache';

import { mockPrisma } from '@/__tests__/mocks/prisma';
import { mockGetAuthSession, mockAuthSession } from '@/__tests__/mocks/auth';
import { mockIsDemoMode } from '@/__tests__/mocks/demo-mode';
import '@/__tests__/mocks/demo-data';
import { createMockRecipient } from '@/__tests__/factories';

import {
  getRecipients,
  createRecipient,
  bulkCreateRecipients,
  deleteRecipient,
} from '../recipients';

describe('recipients actions', () => {
  beforeEach(() => {
    mockIsDemoMode.mockResolvedValue(false);
    mockGetAuthSession.mockResolvedValue(mockAuthSession);
  });

  // ==========================================
  // getRecipients
  // ==========================================
  describe('getRecipients', () => {
    it('returns empty when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getRecipients();

      expect(result).toEqual({ recipients: [], total: 0, page: 1, totalPages: 0 });
    });

    it('returns paginated results scoped to org', async () => {
      const recipients = [createMockRecipient(), createMockRecipient({ id: 'r2' })];
      mockPrisma.recipient.findMany.mockResolvedValue(recipients);
      mockPrisma.recipient.count.mockResolvedValue(2);

      const result = await getRecipients({ page: 1, limit: 20 });

      expect(result.recipients).toEqual(recipients);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);

      // Verify org scoping
      expect(mockPrisma.recipient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'test-org-id',
          }),
        })
      );
    });

    it('applies status filter', async () => {
      mockPrisma.recipient.findMany.mockResolvedValue([]);
      mockPrisma.recipient.count.mockResolvedValue(0);

      await getRecipients({ status: 'active' });

      expect(mockPrisma.recipient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'test-org-id',
            doNotSend: false,
          }),
        })
      );
    });

    it('applies search filter', async () => {
      mockPrisma.recipient.findMany.mockResolvedValue([]);
      mockPrisma.recipient.count.mockResolvedValue(0);

      await getRecipients({ search: 'john' });

      expect(mockPrisma.recipient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'test-org-id',
            OR: expect.arrayContaining([
              expect.objectContaining({ email: { contains: 'john', mode: 'insensitive' } }),
            ]),
          }),
        })
      );
    });
  });

  // ==========================================
  // createRecipient
  // ==========================================
  describe('createRecipient', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        createRecipient({ email: 'new@test.com' })
      ).rejects.toThrow('Unauthorized');
    });

    it('creates recipient scoped to org', async () => {
      const newRecipient = createMockRecipient({ email: 'new@test.com' });
      mockPrisma.recipient.create.mockResolvedValue(newRecipient);

      const result = await createRecipient({
        email: 'new@test.com',
        firstName: 'Jane',
        company: 'Acme',
      });

      expect(mockPrisma.recipient.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'new@test.com',
          firstName: 'Jane',
          company: 'Acme',
          organizationId: 'test-org-id',
        }),
      });
      expect(revalidatePath).toHaveBeenCalledWith('/recipients');
    });

    it('returns mock in demo mode', async () => {
      mockIsDemoMode.mockResolvedValue(true);

      const result = await createRecipient({ email: 'demo@test.com' });

      expect(result.email).toBe('demo@test.com');
      expect(mockPrisma.recipient.create).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // bulkCreateRecipients
  // ==========================================
  describe('bulkCreateRecipients', () => {
    it('rejects more than 1000 recipients', async () => {
      const tooMany = Array.from({ length: 1001 }, (_, i) => ({
        email: `user${i}@test.com`,
      }));

      const result = await bulkCreateRecipients(tooMany);

      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Maximum 1000');
    });

    it('imports new recipients and skips duplicates', async () => {
      const input = [
        { email: 'new1@test.com' },
        { email: 'new2@test.com' },
        { email: 'existing@test.com' },
      ];

      // existing@test.com already exists in the org
      mockPrisma.recipient.findMany.mockResolvedValue([
        { email: 'existing@test.com' },
      ]);
      mockPrisma.recipient.createMany.mockResolvedValue({ count: 2 });

      const result = await bulkCreateRecipients(input);

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify createMany was called with only new emails
      expect(mockPrisma.recipient.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ email: 'new1@test.com', organizationId: 'test-org-id' }),
          expect.objectContaining({ email: 'new2@test.com', organizationId: 'test-org-id' }),
        ]),
        skipDuplicates: true,
      });
    });

    it('handles database errors gracefully', async () => {
      mockPrisma.recipient.findMany.mockResolvedValue([]);
      mockPrisma.recipient.createMany.mockRejectedValue(new Error('DB connection failed'));

      const result = await bulkCreateRecipients([{ email: 'test@test.com' }]);

      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('DB connection failed');
    });

    it('scopes duplicate check to org', async () => {
      mockPrisma.recipient.findMany.mockResolvedValue([]);
      mockPrisma.recipient.createMany.mockResolvedValue({ count: 1 });

      await bulkCreateRecipients([{ email: 'test@test.com' }]);

      expect(mockPrisma.recipient.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'test-org-id',
          email: { in: ['test@test.com'], mode: 'insensitive' },
        },
        select: { email: true },
      });
    });

    it('returns success in demo mode', async () => {
      mockIsDemoMode.mockResolvedValue(true);

      const result = await bulkCreateRecipients([
        { email: 'a@test.com' },
        { email: 'b@test.com' },
      ]);

      expect(result.imported).toBe(2);
      expect(result.skipped).toBe(0);
      expect(mockPrisma.recipient.createMany).not.toHaveBeenCalled();
    });

    it('handles all duplicates (nothing to create)', async () => {
      mockPrisma.recipient.findMany.mockResolvedValue([
        { email: 'a@test.com' },
        { email: 'b@test.com' },
      ]);

      const result = await bulkCreateRecipients([
        { email: 'a@test.com' },
        { email: 'b@test.com' },
      ]);

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(2);
      expect(mockPrisma.recipient.createMany).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // deleteRecipient
  // ==========================================
  describe('deleteRecipient', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(deleteRecipient('r-1')).rejects.toThrow('Unauthorized');
    });

    it('deletes scoped to org', async () => {
      mockPrisma.recipient.delete.mockResolvedValue({});

      await deleteRecipient('r-1');

      expect(mockPrisma.recipient.delete).toHaveBeenCalledWith({
        where: {
          id: 'r-1',
          organizationId: 'test-org-id',
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/recipients');
    });
  });
});
