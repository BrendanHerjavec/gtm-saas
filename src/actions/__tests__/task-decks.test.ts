import { describe, it, expect, beforeEach } from 'vitest';
import { revalidatePath } from 'next/cache';

import { mockPrisma } from '@/__tests__/mocks/prisma';
import { mockGetAuthSession, mockAuthSession } from '@/__tests__/mocks/auth';
import { mockIsDemoMode } from '@/__tests__/mocks/demo-mode';
import '@/__tests__/mocks/demo-data';

import {
  getTaskDecks,
  createTaskDeck,
  openTaskDeck,
  deleteTaskDeck,
  createDeckFromCampaign,
  updateDeckStats,
  createRandomDeck,
  addTasksToDeck,
  getLeaderboard,
} from '../task-decks';

describe('task-decks actions', () => {
  beforeEach(() => {
    mockIsDemoMode.mockResolvedValue(false);
    mockGetAuthSession.mockResolvedValue(mockAuthSession);
  });

  // ==========================================
  // getTaskDecks
  // ==========================================
  describe('getTaskDecks', () => {
    it('returns empty when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getTaskDecks();

      expect(result).toEqual({ decks: [], total: 0, page: 1, totalPages: 0 });
    });

    it('returns paginated decks scoped to org', async () => {
      const decks = [{ id: 'd-1', name: 'Deck 1' }];
      mockPrisma.taskDeck.findMany.mockResolvedValue(decks);
      mockPrisma.taskDeck.count.mockResolvedValue(1);

      const result = await getTaskDecks();

      expect(result.decks).toEqual(decks);
      expect(mockPrisma.taskDeck.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'test-org-id',
          }),
        })
      );
    });

    it('applies status filter', async () => {
      mockPrisma.taskDeck.findMany.mockResolvedValue([]);
      mockPrisma.taskDeck.count.mockResolvedValue(0);

      await getTaskDecks({ status: 'SEALED' });

      expect(mockPrisma.taskDeck.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'SEALED',
          }),
        })
      );
    });
  });

  // ==========================================
  // createTaskDeck
  // ==========================================
  describe('createTaskDeck', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        createTaskDeck({ name: 'New Deck' })
      ).rejects.toThrow('Unauthorized');
    });

    it('creates deck and assigns tasks if provided', async () => {
      const deck = { id: 'deck-new', name: 'Test Deck' };
      mockPrisma.taskDeck.create.mockResolvedValue(deck);
      mockPrisma.outreachTask.updateMany.mockResolvedValue({ count: 2 });

      await createTaskDeck({
        name: 'Test Deck',
        taskIds: ['task-1', 'task-2'],
      });

      expect(mockPrisma.taskDeck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Deck',
          status: 'SEALED',
          totalTasks: 2,
          sourceType: 'manual',
          organizationId: 'test-org-id',
          createdById: 'test-user-id',
        }),
      });

      // Tasks should be assigned to the deck
      expect(mockPrisma.outreachTask.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['task-1', 'task-2'] },
          organizationId: 'test-org-id',
        },
        data: { deckId: 'deck-new' },
      });
    });

    it('creates deck without tasks', async () => {
      mockPrisma.taskDeck.create.mockResolvedValue({ id: 'deck-empty' });

      await createTaskDeck({ name: 'Empty Deck' });

      expect(mockPrisma.outreachTask.updateMany).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // openTaskDeck
  // ==========================================
  describe('openTaskDeck', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(openTaskDeck('deck-1')).rejects.toThrow('Unauthorized');
    });

    it('transitions through OPENING then OPENED with timestamp', async () => {
      mockPrisma.taskDeck.update
        .mockResolvedValueOnce({ status: 'OPENING' })
        .mockResolvedValueOnce({ status: 'OPENED', openedAt: new Date() });

      const result = await openTaskDeck('deck-1');

      // First call: set to OPENING
      expect(mockPrisma.taskDeck.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'deck-1', organizationId: 'test-org-id' },
        data: { status: 'OPENING' },
      });

      // Second call: set to OPENED with timestamp
      expect(mockPrisma.taskDeck.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'deck-1', organizationId: 'test-org-id' },
        data: expect.objectContaining({
          status: 'OPENED',
          openedAt: expect.any(Date),
        }),
      });
    });
  });

  // ==========================================
  // deleteTaskDeck
  // ==========================================
  describe('deleteTaskDeck', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(deleteTaskDeck('deck-1')).rejects.toThrow('Unauthorized');
    });

    it('unassigns tasks then deletes deck', async () => {
      mockPrisma.outreachTask.updateMany.mockResolvedValue({ count: 5 });
      mockPrisma.taskDeck.delete.mockResolvedValue({});

      const result = await deleteTaskDeck('deck-1');

      // First: unassign tasks
      expect(mockPrisma.outreachTask.updateMany).toHaveBeenCalledWith({
        where: { deckId: 'deck-1', organizationId: 'test-org-id' },
        data: { deckId: null },
      });

      // Then: delete deck
      expect(mockPrisma.taskDeck.delete).toHaveBeenCalledWith({
        where: { id: 'deck-1', organizationId: 'test-org-id' },
      });

      expect(result).toEqual({ success: true });
    });
  });

  // ==========================================
  // createDeckFromCampaign
  // ==========================================
  describe('createDeckFromCampaign', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        createDeckFromCampaign('campaign-1', 'Deck Name')
      ).rejects.toThrow('Unauthorized');
    });

    it('returns error when campaign not found', async () => {
      mockPrisma.campaign.findFirst.mockResolvedValue(null);

      const result = await createDeckFromCampaign('nonexistent', 'Deck');

      expect(result).toEqual({ success: false, error: 'Campaign not found' });
    });

    it('returns error when campaign has no recipients', async () => {
      mockPrisma.campaign.findFirst.mockResolvedValue({
        id: 'c-1',
        name: 'Empty Campaign',
        recipients: [],
      });

      const result = await createDeckFromCampaign('c-1', 'Deck');

      expect(result).toEqual({ success: false, error: 'Campaign has no recipients' });
    });

    it('creates deck and tasks for all campaign recipients', async () => {
      const campaign = {
        id: 'c-1',
        name: 'Holiday Campaign',
        description: 'Send gifts',
        recipients: [
          { recipientId: 'r-1', recipient: { firstName: 'John', lastName: 'Doe', company: 'Acme', notes: null } },
          { recipientId: 'r-2', recipient: { firstName: 'Jane', lastName: 'Smith', company: 'Corp', notes: 'VIP' } },
        ],
      };
      mockPrisma.campaign.findFirst.mockResolvedValue(campaign);
      mockPrisma.taskDeck.create.mockResolvedValue({ id: 'deck-new' });
      mockPrisma.outreachTask.findFirst.mockResolvedValue({ sortOrder: 10 });
      mockPrisma.outreachTask.createMany.mockResolvedValue({ count: 2 });

      const result = await createDeckFromCampaign('c-1', 'Holiday Deck', 'VIDEO');

      expect(result).toEqual({ success: true, deckId: 'deck-new', count: 2 });

      // Verify deck was created
      expect(mockPrisma.taskDeck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Holiday Deck',
          status: 'SEALED',
          totalTasks: 2,
          sourceType: 'campaign',
          sourceId: 'c-1',
          organizationId: 'test-org-id',
        }),
      });

      // Verify tasks were created
      expect(mockPrisma.outreachTask.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            recipientId: 'r-1',
            taskType: 'VIDEO',
            deckId: 'deck-new',
            campaignId: 'c-1',
            status: 'PENDING',
          }),
          expect.objectContaining({
            recipientId: 'r-2',
            taskType: 'VIDEO',
            deckId: 'deck-new',
          }),
        ]),
      });
    });
  });

  // ==========================================
  // updateDeckStats
  // ==========================================
  describe('updateDeckStats', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(updateDeckStats('deck-1')).rejects.toThrow('Unauthorized');
    });

    it('recalculates stats from task statuses', async () => {
      mockPrisma.outreachTask.groupBy.mockResolvedValue([
        { status: 'COMPLETED', _count: 5 },
        { status: 'SKIPPED', _count: 2 },
        { status: 'PENDING', _count: 3 },
      ]);
      mockPrisma.taskDeck.update.mockResolvedValue({});

      await updateDeckStats('deck-1');

      expect(mockPrisma.taskDeck.update).toHaveBeenCalledWith({
        where: { id: 'deck-1' },
        data: expect.objectContaining({
          totalTasks: 10,
          completedTasks: 5,
          skippedTasks: 2,
        }),
      });
    });

    it('marks deck COMPLETED when all tasks done', async () => {
      mockPrisma.outreachTask.groupBy.mockResolvedValue([
        { status: 'COMPLETED', _count: 8 },
        { status: 'SKIPPED', _count: 2 },
      ]);
      mockPrisma.taskDeck.update.mockResolvedValue({});

      await updateDeckStats('deck-1');

      expect(mockPrisma.taskDeck.update).toHaveBeenCalledWith({
        where: { id: 'deck-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        }),
      });
    });
  });

  // ==========================================
  // addTasksToDeck
  // ==========================================
  describe('addTasksToDeck', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(addTasksToDeck('deck-1', ['t-1'])).rejects.toThrow('Unauthorized');
    });

    it('throws when deck not found', async () => {
      mockPrisma.taskDeck.findFirst.mockResolvedValue(null);

      await expect(addTasksToDeck('nonexistent', ['t-1'])).rejects.toThrow('Deck not found');
    });

    it('assigns tasks and updates count', async () => {
      mockPrisma.taskDeck.findFirst.mockResolvedValue({ id: 'deck-1' });
      mockPrisma.outreachTask.updateMany.mockResolvedValue({ count: 3 });
      mockPrisma.outreachTask.count.mockResolvedValue(8);
      mockPrisma.taskDeck.update.mockResolvedValue({});

      const result = await addTasksToDeck('deck-1', ['t-1', 't-2', 't-3']);

      expect(result).toEqual({ success: true, count: 3 });
      expect(mockPrisma.taskDeck.update).toHaveBeenCalledWith({
        where: { id: 'deck-1' },
        data: { totalTasks: 8 },
      });
    });
  });

  // ==========================================
  // createRandomDeck
  // ==========================================
  describe('createRandomDeck', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(createRandomDeck(5)).rejects.toThrow('Unauthorized');
    });

    it('returns error when no tasks available', async () => {
      mockPrisma.outreachTask.findMany.mockResolvedValue([]);

      const result = await createRandomDeck(5);

      expect(result).toEqual({ success: false, error: 'No available tasks to add to deck' });
    });

    it('creates deck with random subset of tasks', async () => {
      const tasks = Array.from({ length: 10 }, (_, i) => ({ id: `task-${i}` }));
      mockPrisma.outreachTask.findMany.mockResolvedValue(tasks);
      mockPrisma.taskDeck.create.mockResolvedValue({ id: 'random-deck' });
      mockPrisma.outreachTask.updateMany.mockResolvedValue({ count: 5 });

      const result = await createRandomDeck(5);

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
      expect(mockPrisma.taskDeck.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'SEALED',
          totalTasks: 5,
          sourceType: 'random',
          organizationId: 'test-org-id',
        }),
      });
    });

    it('caps count at available tasks', async () => {
      const tasks = [{ id: 'task-1' }, { id: 'task-2' }];
      mockPrisma.outreachTask.findMany.mockResolvedValue(tasks);
      mockPrisma.taskDeck.create.mockResolvedValue({ id: 'deck' });
      mockPrisma.outreachTask.updateMany.mockResolvedValue({ count: 2 });

      const result = await createRandomDeck(100);

      expect(result.count).toBe(2);
    });
  });

  // ==========================================
  // getLeaderboard
  // ==========================================
  describe('getLeaderboard', () => {
    it('returns empty when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getLeaderboard();

      expect(result).toEqual({
        leaderboard: [],
        currentUserRank: 0,
        totalParticipants: 0,
        period: 'week',
      });
    });

    it('returns ranked leaderboard sorted by completions', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'test-user-id', name: 'You', email: 'test@example.com', image: null },
      ]);

      // Batch query 1: status counts per user (groupBy completedById + status)
      mockPrisma.outreachTask.groupBy
        .mockResolvedValueOnce([ // statusCounts
          { completedById: 'test-user-id', status: 'COMPLETED', _count: 15 },
          { completedById: 'test-user-id', status: 'SKIPPED', _count: 2 },
        ])
        .mockResolvedValueOnce([ // previousCounts
          { completedById: 'test-user-id', _count: 10 },
        ])
        .mockResolvedValueOnce([ // taskTypeBreakdown
          { completedById: 'test-user-id', taskType: 'VIDEO', _count: 8 },
          { completedById: 'test-user-id', taskType: 'GIFT', _count: 7 },
        ]);

      // Batch query 4: recent completions for streaks
      mockPrisma.outreachTask.findMany.mockResolvedValueOnce([]);

      const result = await getLeaderboard('week');

      expect(result.leaderboard.length).toBe(1);
      expect(result.leaderboard[0].completedTasks).toBe(15);
      expect(result.leaderboard[0].skippedTasks).toBe(2);
      expect(result.leaderboard[0].isCurrentUser).toBe(true);
      expect(result.leaderboard[0].rank).toBe(1);
      expect(result.leaderboard[0].trend).toBe('up'); // 15 > 10 previous
      expect(result.leaderboard[0].tasksByType.VIDEO).toBe(8);
      expect(result.leaderboard[0].tasksByType.GIFT).toBe(7);
      expect(result.currentUserRank).toBe(1);
      expect(result.stats.teamTotal).toBe(15);
    });
  });
});
