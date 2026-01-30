import { describe, it, expect, beforeEach } from 'vitest';
import { revalidatePath } from 'next/cache';

import { mockPrisma } from '@/__tests__/mocks/prisma';
import { mockGetAuthSession, mockAuthSession } from '@/__tests__/mocks/auth';
import { mockIsDemoMode } from '@/__tests__/mocks/demo-mode';
import '@/__tests__/mocks/demo-data';
import { createMockBudget } from '@/__tests__/factories';

import {
  getBudgets,
  createBudget,
  deleteBudget,
  getBudgetSummary,
} from '../budget';

describe('budget actions', () => {
  beforeEach(() => {
    mockIsDemoMode.mockResolvedValue(false);
    mockGetAuthSession.mockResolvedValue(mockAuthSession);
  });

  // ==========================================
  // getBudgets
  // ==========================================
  describe('getBudgets', () => {
    it('returns empty when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getBudgets();
      expect(result).toEqual([]);
    });

    it('returns budgets scoped to org', async () => {
      const budgets = [createMockBudget()];
      mockPrisma.budget.findMany.mockResolvedValue(budgets);

      const result = await getBudgets();

      expect(result).toEqual(budgets);
      expect(mockPrisma.budget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'test-org-id',
          }),
        })
      );
    });

    it('filters by type', async () => {
      mockPrisma.budget.findMany.mockResolvedValue([]);

      await getBudgets({ type: 'MONTHLY' });

      expect(mockPrisma.budget.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'MONTHLY',
          }),
        })
      );
    });
  });

  // ==========================================
  // createBudget
  // ==========================================
  describe('createBudget', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        createBudget({
          name: 'Q1',
          type: 'QUARTERLY',
          amount: 5000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-03-31'),
        })
      ).rejects.toThrow('Unauthorized');
    });

    it('creates budget scoped to org', async () => {
      const newBudget = createMockBudget();
      mockPrisma.budget.create.mockResolvedValue(newBudget);

      const input = {
        name: 'Q1 Budget',
        type: 'QUARTERLY',
        amount: 10000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        alertThreshold: 80,
      };

      await createBudget(input);

      expect(mockPrisma.budget.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...input,
          organizationId: 'test-org-id',
        }),
      });
      expect(revalidatePath).toHaveBeenCalledWith('/budget');
    });
  });

  // ==========================================
  // deleteBudget
  // ==========================================
  describe('deleteBudget', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(deleteBudget('b-1')).rejects.toThrow('Unauthorized');
    });

    it('deletes scoped to org', async () => {
      mockPrisma.budget.delete.mockResolvedValue({});

      await deleteBudget('b-1');

      expect(mockPrisma.budget.delete).toHaveBeenCalledWith({
        where: {
          id: 'b-1',
          organizationId: 'test-org-id',
        },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/budget');
    });
  });

  // ==========================================
  // getBudgetSummary
  // ==========================================
  describe('getBudgetSummary', () => {
    it('returns defaults when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getBudgetSummary();

      expect(result).toEqual({
        activeBudget: null,
        monthlySpend: 0,
        totalSpend: 0,
        remaining: null,
        percentUsed: null,
      });
    });

    it('calculates summary with active budget', async () => {
      const activeBudget = createMockBudget({ amount: 10000, spent: 4000 });
      mockPrisma.budget.findFirst.mockResolvedValue(activeBudget);
      mockPrisma.send.aggregate
        .mockResolvedValueOnce({ _sum: { totalCost: 1500 } }) // monthly
        .mockResolvedValueOnce({ _sum: { totalCost: 4000 } }); // total

      const result = await getBudgetSummary();

      expect(result.activeBudget).toEqual(activeBudget);
      expect(result.monthlySpend).toBe(1500);
      expect(result.totalSpend).toBe(4000);
      expect(result.remaining).toBe(6000); // 10000 - 4000
      expect(result.percentUsed).toBe(40); // (4000/10000) * 100
    });

    it('returns null remaining/percent when no active budget', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null);
      mockPrisma.send.aggregate.mockResolvedValue({ _sum: { totalCost: null } });

      const result = await getBudgetSummary();

      expect(result.activeBudget).toBeNull();
      expect(result.remaining).toBeNull();
      expect(result.percentUsed).toBeNull();
      expect(result.monthlySpend).toBe(0);
      expect(result.totalSpend).toBe(0);
    });

    it('scopes budget and spend queries to org', async () => {
      mockPrisma.budget.findFirst.mockResolvedValue(null);
      mockPrisma.send.aggregate.mockResolvedValue({ _sum: { totalCost: null } });

      await getBudgetSummary();

      expect(mockPrisma.budget.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'test-org-id',
          }),
        })
      );

      // Both aggregate calls should include org filter
      for (const call of mockPrisma.send.aggregate.mock.calls) {
        expect(call[0].where.organizationId).toBe('test-org-id');
      }
    });
  });
});
