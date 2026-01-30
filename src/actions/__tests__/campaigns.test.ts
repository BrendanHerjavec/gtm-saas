import { describe, it, expect, beforeEach } from 'vitest';
import { revalidatePath } from 'next/cache';

import { mockPrisma } from '@/__tests__/mocks/prisma';
import { mockGetAuthSession, mockAuthSession } from '@/__tests__/mocks/auth';
import { mockIsDemoMode } from '@/__tests__/mocks/demo-mode';
import '@/__tests__/mocks/demo-data';

import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignStats,
} from '../campaigns';

describe('campaigns actions', () => {
  beforeEach(() => {
    mockIsDemoMode.mockResolvedValue(false);
    mockGetAuthSession.mockResolvedValue(mockAuthSession);
  });

  // ==========================================
  // getCampaigns
  // ==========================================
  describe('getCampaigns', () => {
    it('returns empty when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getCampaigns();

      expect(result.campaigns).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('returns paginated campaigns scoped to org', async () => {
      const campaigns = [{ id: 'c-1', name: 'Campaign 1' }];
      mockPrisma.campaign.findMany.mockResolvedValue(campaigns);
      mockPrisma.campaign.count.mockResolvedValue(1);

      const result = await getCampaigns({ page: 1, limit: 10 });

      expect(result.campaigns).toEqual(campaigns);
      expect(result.pagination.total).toBe(1);
      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'test-org-id',
          }),
        })
      );
    });

    it('applies status and search filters', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.campaign.count.mockResolvedValue(0);

      await getCampaigns({ status: 'ACTIVE', search: 'holiday' });

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'test-org-id',
            status: 'ACTIVE',
            name: { contains: 'holiday', mode: 'insensitive' },
          }),
        })
      );
    });
  });

  // ==========================================
  // getCampaign
  // ==========================================
  describe('getCampaign', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(getCampaign('c-1')).rejects.toThrow('Unauthorized');
    });

    it('throws when campaign not found', async () => {
      mockPrisma.campaign.findFirst.mockResolvedValue(null);

      await expect(getCampaign('nonexistent')).rejects.toThrow('Campaign not found');
    });

    it('returns campaign scoped to org', async () => {
      const campaign = { id: 'c-1', name: 'Test', organizationId: 'test-org-id' };
      mockPrisma.campaign.findFirst.mockResolvedValue(campaign);

      const result = await getCampaign('c-1');

      expect(result).toEqual(campaign);
      expect(mockPrisma.campaign.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'c-1',
          organizationId: 'test-org-id',
        },
        include: expect.any(Object),
      });
    });
  });

  // ==========================================
  // createCampaign
  // ==========================================
  describe('createCampaign', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(createCampaign({ name: 'Test' })).rejects.toThrow('Unauthorized');
    });

    it('creates campaign with stats and correct fields', async () => {
      const campaign = { id: 'c-new', name: 'Holiday', organizationId: 'test-org-id' };
      mockPrisma.campaign.create.mockResolvedValue(campaign);
      mockPrisma.campaignStats.create.mockResolvedValue({});

      const result = await createCampaign({ name: 'Holiday', description: 'Gift campaign' });

      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: {
          name: 'Holiday',
          description: 'Gift campaign',
          type: 'MANUAL',
          organizationId: 'test-org-id',
          createdById: 'test-user-id',
        },
      });
      expect(mockPrisma.campaignStats.create).toHaveBeenCalledWith({
        data: { campaignId: 'c-new' },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/campaigns');
    });

    it('maps content to description for backward compat', async () => {
      mockPrisma.campaign.create.mockResolvedValue({ id: 'c-1' });
      mockPrisma.campaignStats.create.mockResolvedValue({});

      await createCampaign({ name: 'Test', content: 'Legacy description' } as any);

      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Legacy description',
        }),
      });
    });

    it('returns mock in demo mode', async () => {
      mockIsDemoMode.mockResolvedValue(true);

      const result = await createCampaign({ name: 'Demo Campaign' });

      expect(result.name).toBe('Demo Campaign');
      expect(result.status).toBe('DRAFT');
      expect(mockPrisma.campaign.create).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // updateCampaign
  // ==========================================
  describe('updateCampaign', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(updateCampaign('c-1', { name: 'Updated' })).rejects.toThrow('Unauthorized');
    });

    it('updates scoped to org via updateMany', async () => {
      mockPrisma.campaign.updateMany.mockResolvedValue({ count: 1 });

      const result = await updateCampaign('c-1', { name: 'Updated', status: 'ACTIVE' });

      expect(mockPrisma.campaign.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'c-1',
          organizationId: 'test-org-id',
        },
        data: { name: 'Updated', status: 'ACTIVE' },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/campaigns');
      expect(revalidatePath).toHaveBeenCalledWith('/campaigns/c-1');
    });
  });

  // ==========================================
  // deleteCampaign
  // ==========================================
  describe('deleteCampaign', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(deleteCampaign('c-1')).rejects.toThrow('Unauthorized');
    });

    it('deletes scoped to org', async () => {
      mockPrisma.campaign.deleteMany.mockResolvedValue({ count: 1 });

      await deleteCampaign('c-1');

      expect(mockPrisma.campaign.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'c-1',
          organizationId: 'test-org-id',
        },
      });
    });
  });

  // ==========================================
  // getCampaignStats
  // ==========================================
  describe('getCampaignStats', () => {
    it('returns zeros when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getCampaignStats();

      expect(result.total).toBe(0);
      expect(result.metrics.sent).toBe(0);
    });

    it('returns aggregated stats with delivery rates', async () => {
      mockPrisma.campaign.count.mockResolvedValue(5);
      mockPrisma.campaign.groupBy.mockResolvedValue([
        { status: 'ACTIVE', _count: { status: 3 } },
        { status: 'DRAFT', _count: { status: 2 } },
      ]);
      mockPrisma.campaignStats.aggregate.mockResolvedValue({
        _sum: { totalSends: 100, delivered: 80, shipped: 15, pending: 3, failed: 2 },
      });

      const result = await getCampaignStats();

      expect(result.total).toBe(5);
      expect(result.byStatus).toEqual({ ACTIVE: 3, DRAFT: 2 });
      expect(result.metrics.sent).toBe(100);
      expect(result.metrics.delivered).toBe(80);
      expect(result.metrics.deliveryRate).toBe(80); // (80/100)*100
    });

    it('handles zero sends gracefully', async () => {
      mockPrisma.campaign.count.mockResolvedValue(1);
      mockPrisma.campaign.groupBy.mockResolvedValue([]);
      mockPrisma.campaignStats.aggregate.mockResolvedValue({
        _sum: { totalSends: null, delivered: null, shipped: null, pending: null, failed: null },
      });

      const result = await getCampaignStats();

      expect(result.metrics.deliveryRate).toBe(0);
      expect(result.metrics.openRate).toBe(0);
    });
  });
});
