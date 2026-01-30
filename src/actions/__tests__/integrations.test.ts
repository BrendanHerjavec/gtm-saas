import { describe, it, expect, beforeEach, vi } from 'vitest';
import { revalidatePath } from 'next/cache';

import { mockPrisma } from '@/__tests__/mocks/prisma';
import { mockGetAuthSession, mockAuthSession } from '@/__tests__/mocks/auth';
import { mockIsDemoMode } from '@/__tests__/mocks/demo-mode';

// Mock integration-specific dependencies
const mockGetIntegration = vi.fn();
const mockHasActiveIntegration = vi.fn();
vi.mock('@/lib/integrations/oauth', () => ({
  getIntegration: (...args: any[]) => mockGetIntegration(...args),
  hasActiveIntegration: (...args: any[]) => mockHasActiveIntegration(...args),
}));

const mockGetProviderAdapter = vi.fn();
vi.mock('@/lib/integrations/providers', () => ({
  getProviderAdapter: (...args: any[]) => mockGetProviderAdapter(...args),
}));

const mockDecrypt = vi.fn((val: string) => val);
vi.mock('@/lib/integrations/encryption', () => ({
  decrypt: (...args: any[]) => mockDecrypt(...args),
}));

const mockRunInitialSync = vi.fn();
const mockRunIncrementalSync = vi.fn();
vi.mock('@/lib/integrations/sync', () => ({
  runInitialSync: (...args: any[]) => mockRunInitialSync(...args),
  runIncrementalSync: (...args: any[]) => mockRunIncrementalSync(...args),
}));

// Mock the demo integrations module (different from the standard demo-mode)
const mockCreateDemoIntegration = vi.fn();
const mockSimulateDemoSync = vi.fn();
vi.mock('@/lib/integrations/demo', () => ({
  isDemoMode: () => mockIsDemoMode(),
  createDemoIntegration: (...args: any[]) => mockCreateDemoIntegration(...args),
  simulateDemoSync: (...args: any[]) => mockSimulateDemoSync(...args),
}));

import {
  checkIntegration,
  triggerSync,
  disconnectIntegration,
  getSyncLogs,
} from '../integrations';

describe('integrations actions', () => {
  beforeEach(() => {
    mockIsDemoMode.mockResolvedValue(false);
    mockGetAuthSession.mockResolvedValue(mockAuthSession);
  });

  // ==========================================
  // checkIntegration
  // ==========================================
  describe('checkIntegration', () => {
    it('returns false when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await checkIntegration();
      expect(result).toEqual({ hasIntegration: false });
    });

    it('returns false when no integration exists', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue(null);

      const result = await checkIntegration();
      expect(result).toEqual({ hasIntegration: false });
    });

    it('returns provider info when integration exists', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue({
        provider: 'hubspot',
        status: 'CONNECTED',
      });

      const result = await checkIntegration();

      expect(result).toEqual({
        hasIntegration: true,
        provider: 'hubspot',
        status: 'CONNECTED',
      });
    });
  });

  // ==========================================
  // triggerSync
  // ==========================================
  describe('triggerSync', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(triggerSync()).rejects.toThrow('Unauthorized');
    });

    it('returns error when no active integration', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue(null);

      const result = await triggerSync();

      expect(result).toEqual({ success: false, error: 'No active integration' });
    });

    it('returns error when integration not CONNECTED', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue({
        status: 'DISCONNECTED',
        accessToken: 'token',
      });

      const result = await triggerSync();

      expect(result).toEqual({ success: false, error: 'No active integration' });
    });

    it('runs initial sync when no previous sync', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue({
        status: 'CONNECTED',
        accessToken: 'real-token',
        lastSyncAt: null,
      });
      mockRunInitialSync.mockResolvedValue(undefined);

      const result = await triggerSync();

      expect(result).toEqual({ success: true });
      expect(mockRunInitialSync).toHaveBeenCalledWith('test-org-id');
      expect(mockRunIncrementalSync).not.toHaveBeenCalled();
    });

    it('runs incremental sync when previously synced', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue({
        status: 'CONNECTED',
        accessToken: 'real-token',
        lastSyncAt: new Date('2024-01-01'),
      });
      mockRunIncrementalSync.mockResolvedValue(undefined);

      const result = await triggerSync();

      expect(result).toEqual({ success: true });
      expect(mockRunIncrementalSync).toHaveBeenCalledWith('test-org-id');
      expect(mockRunInitialSync).not.toHaveBeenCalled();
    });

    it('uses demo sync for demo integrations', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue({
        status: 'CONNECTED',
        accessToken: 'demo-access-token-not-real',
        lastSyncAt: null,
      });
      mockSimulateDemoSync.mockResolvedValue(undefined);

      const result = await triggerSync();

      expect(result).toEqual({ success: true });
      expect(mockSimulateDemoSync).toHaveBeenCalledWith('test-org-id');
      expect(mockRunInitialSync).not.toHaveBeenCalled();
    });

    it('handles sync errors gracefully', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue({
        status: 'CONNECTED',
        accessToken: 'token',
        lastSyncAt: null,
      });
      mockRunInitialSync.mockRejectedValue(new Error('API rate limit'));

      const result = await triggerSync();

      expect(result).toEqual({ success: false, error: 'API rate limit' });
    });

    it('revalidates all related paths on success', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue({
        status: 'CONNECTED',
        accessToken: 'token',
        lastSyncAt: new Date(),
      });
      mockRunIncrementalSync.mockResolvedValue(undefined);

      await triggerSync();

      expect(revalidatePath).toHaveBeenCalledWith('/integrations');
      expect(revalidatePath).toHaveBeenCalledWith('/leads');
      expect(revalidatePath).toHaveBeenCalledWith('/contacts');
      expect(revalidatePath).toHaveBeenCalledWith('/companies');
      expect(revalidatePath).toHaveBeenCalledWith('/deals');
    });
  });

  // ==========================================
  // disconnectIntegration
  // ==========================================
  describe('disconnectIntegration', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(disconnectIntegration()).rejects.toThrow('Unauthorized');
    });

    it('returns error when no integration found', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue(null);

      const result = await disconnectIntegration();

      expect(result).toEqual({ success: false, error: 'No integration found' });
    });

    it('deletes integration and clears recipient external refs', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue({
        id: 'int-1',
        webhookId: null,
        accessToken: 'token',
      });
      mockPrisma.cRMIntegration.delete.mockResolvedValue({});
      mockPrisma.recipient.updateMany.mockResolvedValue({ count: 50 });

      const result = await disconnectIntegration();

      expect(result).toEqual({ success: true });

      // Integration deleted
      expect(mockPrisma.cRMIntegration.delete).toHaveBeenCalledWith({
        where: { id: 'int-1' },
      });

      // Recipient external refs cleared
      expect(mockPrisma.recipient.updateMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'test-org-id',
          externalId: { not: null },
        },
        data: {
          externalId: null,
          externalSource: null,
          externalUrl: null,
          syncStatus: null,
          lastSyncedAt: null,
        },
      });
    });

    it('continues even if webhook deletion fails', async () => {
      const mockDeleteWebhook = vi.fn().mockRejectedValue(new Error('Webhook API error'));
      mockGetProviderAdapter.mockReturnValue({ deleteWebhook: mockDeleteWebhook });

      mockPrisma.cRMIntegration.findUnique.mockResolvedValue({
        id: 'int-1',
        webhookId: 'wh-123',
        accessToken: 'token',
        provider: 'hubspot',
        instanceUrl: null,
      });
      mockPrisma.cRMIntegration.delete.mockResolvedValue({});
      mockPrisma.recipient.updateMany.mockResolvedValue({ count: 0 });

      const result = await disconnectIntegration();

      // Should succeed despite webhook error
      expect(result).toEqual({ success: true });
      expect(mockPrisma.cRMIntegration.delete).toHaveBeenCalled();
    });
  });

  // ==========================================
  // getSyncLogs
  // ==========================================
  describe('getSyncLogs', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(getSyncLogs()).rejects.toThrow('Unauthorized');
    });

    it('returns empty when no integration', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue(null);

      const result = await getSyncLogs();
      expect(result).toEqual([]);
    });

    it('returns logs ordered by startedAt desc', async () => {
      mockPrisma.cRMIntegration.findUnique.mockResolvedValue({ id: 'int-1' });
      const logs = [{ id: 'log-1' }, { id: 'log-2' }];
      mockPrisma.syncLog.findMany.mockResolvedValue(logs);

      const result = await getSyncLogs(10);

      expect(result).toEqual(logs);
      expect(mockPrisma.syncLog.findMany).toHaveBeenCalledWith({
        where: { integrationId: 'int-1' },
        orderBy: { startedAt: 'desc' },
        take: 10,
      });
    });
  });
});
