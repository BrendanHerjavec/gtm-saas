import { describe, it, expect, beforeEach } from 'vitest';
import { revalidatePath } from 'next/cache';

import { mockPrisma } from '@/__tests__/mocks/prisma';
import { mockGetAuthSession, mockAuthSession } from '@/__tests__/mocks/auth';
import { mockIsDemoMode } from '@/__tests__/mocks/demo-mode';
import '@/__tests__/mocks/demo-data';
import { createMockSend, createMockGiftItem } from '@/__tests__/factories';

import {
  getSends,
  createSend,
  cancelSend,
  getSendStats,
} from '../sends';

describe('sends actions', () => {
  beforeEach(() => {
    mockIsDemoMode.mockResolvedValue(false);
    mockGetAuthSession.mockResolvedValue(mockAuthSession);
  });

  // ==========================================
  // getSends
  // ==========================================
  describe('getSends', () => {
    it('returns empty when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getSends();

      expect(result).toEqual({ sends: [], total: 0, page: 1, totalPages: 0 });
    });

    it('returns paginated results scoped to org', async () => {
      const sends = [createMockSend(), createMockSend({ id: 's2' })];
      mockPrisma.send.findMany.mockResolvedValue(sends);
      mockPrisma.send.count.mockResolvedValue(2);

      const result = await getSends({ page: 1, limit: 20 });

      expect(result.sends).toEqual(sends);
      expect(result.total).toBe(2);

      expect(mockPrisma.send.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'test-org-id',
          }),
        })
      );
    });

    it('applies status and type filters', async () => {
      mockPrisma.send.findMany.mockResolvedValue([]);
      mockPrisma.send.count.mockResolvedValue(0);

      await getSends({ status: 'DELIVERED', type: 'GIFT' });

      expect(mockPrisma.send.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'test-org-id',
            status: 'DELIVERED',
            type: 'GIFT',
          }),
        })
      );
    });
  });

  // ==========================================
  // createSend
  // ==========================================
  describe('createSend', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        createSend({ recipientId: 'r-1', type: 'VIDEO' })
      ).rejects.toThrow('Unauthorized');
    });

    it('creates send with correct fields', async () => {
      const newSend = createMockSend({ id: 'new-send' });
      mockPrisma.send.create.mockResolvedValue(newSend);

      const result = await createSend({
        recipientId: 'r-1',
        type: 'VIDEO',
        message: 'Hello!',
      });

      expect(mockPrisma.send.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: 'r-1',
          type: 'VIDEO',
          message: 'Hello!',
          organizationId: 'test-org-id',
          userId: 'test-user-id',
          itemCost: 0,
          totalCost: 0,
          triggerType: 'manual',
        }),
        include: {
          recipient: true,
          giftItem: true,
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/sends');
    });

    it('calculates cost from gift item when provided', async () => {
      const giftItem = createMockGiftItem({ price: 49.99 });
      mockPrisma.giftItem.findUnique.mockResolvedValue(giftItem);
      mockPrisma.send.create.mockResolvedValue(createMockSend({ itemCost: 49.99, totalCost: 49.99 }));

      await createSend({
        recipientId: 'r-1',
        type: 'GIFT',
        giftItemId: 'gift-123',
      });

      expect(mockPrisma.send.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          itemCost: 49.99,
          totalCost: 49.99,
          giftItemId: 'gift-123',
        }),
        include: expect.any(Object),
      });
    });

    it('handles missing gift item gracefully', async () => {
      mockPrisma.giftItem.findUnique.mockResolvedValue(null);
      mockPrisma.send.create.mockResolvedValue(createMockSend());

      await createSend({
        recipientId: 'r-1',
        type: 'GIFT',
        giftItemId: 'nonexistent',
      });

      expect(mockPrisma.send.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          itemCost: 0,
          totalCost: 0,
        }),
        include: expect.any(Object),
      });
    });

    it('returns mock in demo mode', async () => {
      mockIsDemoMode.mockResolvedValue(true);

      const result = await createSend({ recipientId: 'r-1', type: 'VIDEO' });

      expect(result.status).toBe('PENDING');
      expect(result.triggerType).toBe('manual');
      expect(mockPrisma.send.create).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // cancelSend
  // ==========================================
  describe('cancelSend', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(cancelSend('s-1')).rejects.toThrow('Unauthorized');
    });

    it('updates status to CANCELLED scoped to org', async () => {
      mockPrisma.send.update.mockResolvedValue(createMockSend({ status: 'CANCELLED' }));

      const result = await cancelSend('s-1');

      expect(mockPrisma.send.update).toHaveBeenCalledWith({
        where: {
          id: 's-1',
          organizationId: 'test-org-id',
        },
        data: { status: 'CANCELLED' },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/sends');
    });
  });

  // ==========================================
  // getSendStats
  // ==========================================
  describe('getSendStats', () => {
    it('returns null when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getSendStats();
      expect(result).toBeNull();
    });

    it('returns aggregated stats', async () => {
      mockPrisma.send.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10)  // pending
        .mockResolvedValueOnce(20)  // shipped
        .mockResolvedValueOnce(60)  // delivered
        .mockResolvedValueOnce(5);  // failed
      mockPrisma.send.aggregate.mockResolvedValue({ _sum: { totalCost: 5000 } });

      const result = await getSendStats();

      expect(result).toEqual({
        total: 100,
        pending: 10,
        shipped: 20,
        delivered: 60,
        failed: 5,
        totalSpent: 5000,
      });
    });

    it('returns 0 for totalSpent when no sends', async () => {
      mockPrisma.send.count.mockResolvedValue(0);
      mockPrisma.send.aggregate.mockResolvedValue({ _sum: { totalCost: null } });

      const result = await getSendStats();

      expect(result!.totalSpent).toBe(0);
    });

    it('scopes all queries to org', async () => {
      mockPrisma.send.count.mockResolvedValue(0);
      mockPrisma.send.aggregate.mockResolvedValue({ _sum: { totalCost: null } });

      await getSendStats();

      // All count calls should include org filter
      for (const call of mockPrisma.send.count.mock.calls) {
        expect(call[0].where.organizationId).toBe('test-org-id');
      }
    });
  });
});
