import { describe, it, expect, beforeEach } from 'vitest';
import { revalidatePath } from 'next/cache';

import { mockPrisma } from '@/__tests__/mocks/prisma';
import { mockGetAuthSession, mockAuthSession } from '@/__tests__/mocks/auth';
import { mockIsDemoMode } from '@/__tests__/mocks/demo-mode';
import '@/__tests__/mocks/demo-data';
import { createMockOutreachTask, createMockSend } from '@/__tests__/factories';

import {
  completeOutreachTask,
  skipOutreachTask,
  createOutreachTask,
  getTaskDeckStats,
  getOutreachTasks,
  deleteOutreachTask,
} from '../tasks';

// Mock the validations module (types only, no runtime validation in actions)
vi.mock('@/lib/validations', () => ({}));

describe('tasks actions', () => {
  beforeEach(() => {
    mockIsDemoMode.mockResolvedValue(false);
    mockGetAuthSession.mockResolvedValue(mockAuthSession);
  });

  // ==========================================
  // completeOutreachTask
  // ==========================================
  describe('completeOutreachTask', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        completeOutreachTask({ taskId: 'task-1', message: 'Done' })
      ).rejects.toThrow('Unauthorized');
    });

    it('throws when task not found', async () => {
      mockPrisma.outreachTask.findFirst.mockResolvedValue(null);

      await expect(
        completeOutreachTask({ taskId: 'nonexistent', message: 'Done' })
      ).rejects.toThrow('Task not found');
    });

    it('creates Send and updates Task on completion', async () => {
      const task = createMockOutreachTask({
        id: 'task-1',
        recipientId: 'r-1',
        taskType: 'VIDEO',
        campaignId: 'campaign-1',
      });
      const send = createMockSend({ id: 'send-1' });

      mockPrisma.outreachTask.findFirst.mockResolvedValue(task);
      mockPrisma.send.create.mockResolvedValue(send);
      mockPrisma.outreachTask.update.mockResolvedValue({
        ...task,
        status: 'COMPLETED',
        sendId: 'send-1',
      });

      const result = await completeOutreachTask({
        taskId: 'task-1',
        message: 'Great meeting!',
        videoUrl: 'https://example.com/video',
      });

      // Verify Send was created with correct fields
      expect(mockPrisma.send.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: 'r-1',
          organizationId: 'test-org-id',
          userId: 'test-user-id',
          type: 'VIDEO',
          status: 'PENDING',
          message: 'Great meeting!',
          videoUrl: 'https://example.com/video',
          campaignId: 'campaign-1',
          triggerType: 'manual',
        }),
      });

      // Verify Task was updated
      expect(mockPrisma.outreachTask.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedById: 'test-user-id',
          sendId: 'send-1',
        }),
      });

      expect(result.task).toBeDefined();
      expect(result.send).toBeDefined();
      expect(revalidatePath).toHaveBeenCalledWith('/tasks');
      expect(revalidatePath).toHaveBeenCalledWith('/sends');
    });

    it('scopes task lookup to org', async () => {
      mockPrisma.outreachTask.findFirst.mockResolvedValue(null);

      try {
        await completeOutreachTask({ taskId: 'task-1' });
      } catch {
        // Expected to throw
      }

      expect(mockPrisma.outreachTask.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
          organizationId: 'test-org-id',
        },
      });
    });

    it('returns mock data in demo mode', async () => {
      mockIsDemoMode.mockResolvedValue(true);

      // In demo mode with empty demoOutreachTasks, it should throw
      await expect(
        completeOutreachTask({ taskId: 'demo-task-1' })
      ).rejects.toThrow('Task not found');

      expect(mockPrisma.send.create).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // skipOutreachTask
  // ==========================================
  describe('skipOutreachTask', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(skipOutreachTask('task-1', 'Not relevant')).rejects.toThrow('Unauthorized');
    });

    it('updates status to SKIPPED with reason', async () => {
      const updatedTask = createMockOutreachTask({
        status: 'SKIPPED',
        skipReason: 'Not relevant',
      });
      mockPrisma.outreachTask.update.mockResolvedValue(updatedTask);

      const result = await skipOutreachTask('task-1', 'Not relevant');

      expect(mockPrisma.outreachTask.update).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
          organizationId: 'test-org-id',
        },
        data: expect.objectContaining({
          status: 'SKIPPED',
          skipReason: 'Not relevant',
          completedById: 'test-user-id',
        }),
      });
      expect(revalidatePath).toHaveBeenCalledWith('/tasks');
    });
  });

  // ==========================================
  // createOutreachTask
  // ==========================================
  describe('createOutreachTask', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        createOutreachTask({
          recipientId: 'r-1',
          taskType: 'VIDEO',
          title: 'Test task',
        } as any)
      ).rejects.toThrow('Unauthorized');
    });

    it('creates task with auto-incremented sortOrder', async () => {
      mockPrisma.outreachTask.findFirst.mockResolvedValue({ sortOrder: 5 });
      mockPrisma.outreachTask.create.mockResolvedValue(
        createMockOutreachTask({ sortOrder: 6 })
      );

      await createOutreachTask({
        recipientId: 'r-1',
        taskType: 'VIDEO',
        title: 'Record video',
        description: 'Personalized video',
        priority: 3,
      } as any);

      expect(mockPrisma.outreachTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'test-org-id',
          sortOrder: 6,
          assignedToId: 'test-user-id',
        }),
        include: { recipient: true },
      });
    });

    it('starts sortOrder at 0 when no existing tasks', async () => {
      mockPrisma.outreachTask.findFirst.mockResolvedValue(null);
      mockPrisma.outreachTask.create.mockResolvedValue(createMockOutreachTask());

      await createOutreachTask({
        recipientId: 'r-1',
        taskType: 'VIDEO',
        title: 'First task',
      } as any);

      expect(mockPrisma.outreachTask.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sortOrder: 0,
        }),
        include: expect.any(Object),
      });
    });
  });

  // ==========================================
  // getTaskDeckStats
  // ==========================================
  describe('getTaskDeckStats', () => {
    it('returns zeros when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getTaskDeckStats();

      expect(result).toEqual({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        skipped: 0,
        actionable: 0,
        byType: { GIFT: 0, HANDWRITTEN_NOTE: 0, VIDEO: 0, EXPERIENCE: 0, DIRECT_MAIL: 0 },
      });
    });

    it('returns correct counts and actionable total', async () => {
      mockPrisma.outreachTask.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(20) // pending
        .mockResolvedValueOnce(5)  // in_progress
        .mockResolvedValueOnce(20) // completed
        .mockResolvedValueOnce(5); // skipped
      mockPrisma.outreachTask.groupBy.mockResolvedValue([
        { taskType: 'VIDEO', _count: 10 },
        { taskType: 'GIFT', _count: 8 },
        { taskType: 'HANDWRITTEN_NOTE', _count: 2 },
      ]);

      const result = await getTaskDeckStats();

      expect(result.total).toBe(50);
      expect(result.pending).toBe(20);
      expect(result.inProgress).toBe(5);
      expect(result.completed).toBe(20);
      expect(result.skipped).toBe(5);
      expect(result.actionable).toBe(25); // pending + inProgress
      expect(result.byType.VIDEO).toBe(10);
      expect(result.byType.GIFT).toBe(8);
      expect(result.byType.HANDWRITTEN_NOTE).toBe(2);
      expect(result.byType.EXPERIENCE).toBe(0);
      expect(result.byType.DIRECT_MAIL).toBe(0);
    });

    it('scopes all queries to org', async () => {
      mockPrisma.outreachTask.count.mockResolvedValue(0);
      mockPrisma.outreachTask.groupBy.mockResolvedValue([]);

      await getTaskDeckStats();

      for (const call of mockPrisma.outreachTask.count.mock.calls) {
        expect(call[0].where.organizationId).toBe('test-org-id');
      }
    });
  });

  // ==========================================
  // getOutreachTasks
  // ==========================================
  describe('getOutreachTasks', () => {
    it('returns empty when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getOutreachTasks();

      expect(result).toEqual({ tasks: [], total: 0, page: 1, totalPages: 0 });
    });

    it('returns paginated tasks scoped to org', async () => {
      const tasks = [createMockOutreachTask()];
      mockPrisma.outreachTask.findMany.mockResolvedValue(tasks);
      mockPrisma.outreachTask.count.mockResolvedValue(1);

      const result = await getOutreachTasks({ page: 1, limit: 20 });

      expect(result.tasks).toEqual(tasks);
      expect(mockPrisma.outreachTask.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'test-org-id',
          }),
        })
      );
    });
  });

  // ==========================================
  // deleteOutreachTask
  // ==========================================
  describe('deleteOutreachTask', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(deleteOutreachTask('task-1')).rejects.toThrow('Unauthorized');
    });

    it('deletes scoped to org', async () => {
      mockPrisma.outreachTask.delete.mockResolvedValue({});

      const result = await deleteOutreachTask('task-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.outreachTask.delete).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
          organizationId: 'test-org-id',
        },
      });
    });
  });
});
