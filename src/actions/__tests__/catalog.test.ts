import { describe, it, expect, beforeEach } from 'vitest';
import { revalidatePath } from 'next/cache';

import { mockPrisma } from '@/__tests__/mocks/prisma';
import { mockGetAuthSession, mockAuthSession } from '@/__tests__/mocks/auth';
import { mockIsDemoMode } from '@/__tests__/mocks/demo-mode';
import '@/__tests__/mocks/demo-data';
import { createMockGiftItem } from '@/__tests__/factories';

import {
  getCatalog,
  getGiftItem,
  createGiftItem,
  updateGiftItem,
  deleteGiftItem,
  getCategories,
  createCategory,
  getVendors,
} from '../catalog';

describe('catalog actions', () => {
  beforeEach(() => {
    mockIsDemoMode.mockResolvedValue(false);
    mockGetAuthSession.mockResolvedValue(mockAuthSession);
  });

  // ==========================================
  // getCatalog
  // ==========================================
  describe('getCatalog', () => {
    it('returns empty when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getCatalog();

      expect(result).toEqual({ items: [], total: 0, page: 1, totalPages: 0 });
    });

    it('returns items scoped to org with isActive filter', async () => {
      const items = [createMockGiftItem()];
      mockPrisma.giftItem.findMany.mockResolvedValue(items);
      mockPrisma.giftItem.count.mockResolvedValue(1);

      const result = await getCatalog();

      expect(result.items).toEqual(items);
      expect(mockPrisma.giftItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'test-org-id',
            isActive: true,
          }),
        })
      );
    });

    it('applies type and search filters', async () => {
      mockPrisma.giftItem.findMany.mockResolvedValue([]);
      mockPrisma.giftItem.count.mockResolvedValue(0);

      await getCatalog({ type: 'DIGITAL', search: 'coffee' });

      expect(mockPrisma.giftItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'DIGITAL',
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'coffee', mode: 'insensitive' } }),
            ]),
          }),
        })
      );
    });

    it('applies inStock filter', async () => {
      mockPrisma.giftItem.findMany.mockResolvedValue([]);
      mockPrisma.giftItem.count.mockResolvedValue(0);

      await getCatalog({ inStock: true });

      expect(mockPrisma.giftItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            inStock: true,
          }),
        })
      );
    });
  });

  // ==========================================
  // getGiftItem
  // ==========================================
  describe('getGiftItem', () => {
    it('returns null when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getGiftItem('g-1');
      expect(result).toBeNull();
    });

    it('returns item scoped to org', async () => {
      const item = createMockGiftItem();
      mockPrisma.giftItem.findFirst.mockResolvedValue(item);

      await getGiftItem('g-1');

      expect(mockPrisma.giftItem.findFirst).toHaveBeenCalledWith({
        where: { id: 'g-1', organizationId: 'test-org-id' },
        include: { category: true, vendor: true },
      });
    });
  });

  // ==========================================
  // createGiftItem
  // ==========================================
  describe('createGiftItem', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        createGiftItem({ name: 'Test', price: 25, type: 'DIGITAL', currency: 'USD' })
      ).rejects.toThrow('Unauthorized');
    });

    it('creates item scoped to org', async () => {
      const item = createMockGiftItem();
      mockPrisma.giftItem.create.mockResolvedValue(item);

      await createGiftItem({ name: 'Coffee Card', price: 25, type: 'DIGITAL', currency: 'USD' });

      expect(mockPrisma.giftItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Coffee Card',
          price: 25,
          type: 'DIGITAL',
          organizationId: 'test-org-id',
        }),
      });
      expect(revalidatePath).toHaveBeenCalledWith('/catalog');
    });

    it('returns mock in demo mode', async () => {
      mockIsDemoMode.mockResolvedValue(true);

      const result = await createGiftItem({ name: 'Demo Item', price: 10, type: 'PHYSICAL', currency: 'USD' });

      expect(result.name).toBe('Demo Item');
      expect(mockPrisma.giftItem.create).not.toHaveBeenCalled();
    });

    it('rejects invalid input', async () => {
      await expect(
        createGiftItem({ name: '', price: -5, type: 'DIGITAL', currency: 'USD' })
      ).rejects.toThrow('Validation failed');
    });
  });

  // ==========================================
  // updateGiftItem
  // ==========================================
  describe('updateGiftItem', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        updateGiftItem('g-1', { price: 30 })
      ).rejects.toThrow('Unauthorized');
    });

    it('updates item scoped to org', async () => {
      mockPrisma.giftItem.update.mockResolvedValue(createMockGiftItem({ price: 30 }));

      await updateGiftItem('g-1', { price: 30, inStock: false });

      expect(mockPrisma.giftItem.update).toHaveBeenCalledWith({
        where: { id: 'g-1', organizationId: 'test-org-id' },
        data: { price: 30, inStock: false },
      });
    });
  });

  // ==========================================
  // deleteGiftItem
  // ==========================================
  describe('deleteGiftItem', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(deleteGiftItem('g-1')).rejects.toThrow('Unauthorized');
    });

    it('deletes scoped to org', async () => {
      mockPrisma.giftItem.delete.mockResolvedValue({});

      await deleteGiftItem('g-1');

      expect(mockPrisma.giftItem.delete).toHaveBeenCalledWith({
        where: { id: 'g-1', organizationId: 'test-org-id' },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/catalog');
    });
  });

  // ==========================================
  // getCategories
  // ==========================================
  describe('getCategories', () => {
    it('returns empty when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getCategories();
      expect(result).toEqual([]);
    });

    it('returns categories scoped to org', async () => {
      mockPrisma.giftCategory.findMany.mockResolvedValue([{ id: 'cat-1', name: 'Tech' }]);

      await getCategories();

      expect(mockPrisma.giftCategory.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'test-org-id' },
        orderBy: { name: 'asc' },
      });
    });
  });

  // ==========================================
  // createCategory
  // ==========================================
  describe('createCategory', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        createCategory({ name: 'Tech' })
      ).rejects.toThrow('Unauthorized');
    });

    it('creates category scoped to org', async () => {
      mockPrisma.giftCategory.create.mockResolvedValue({ id: 'cat-new' });

      await createCategory({ name: 'Wellness', icon: 'Heart', color: '#FF0000' });

      expect(mockPrisma.giftCategory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Wellness',
          icon: 'Heart',
          color: '#FF0000',
          organizationId: 'test-org-id',
        }),
      });
    });
  });

  // ==========================================
  // getVendors
  // ==========================================
  describe('getVendors', () => {
    it('returns empty when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getVendors();
      expect(result).toEqual([]);
    });

    it('returns active vendors scoped to org', async () => {
      mockPrisma.vendor.findMany.mockResolvedValue([{ id: 'v-1', name: 'Sendoso' }]);

      await getVendors();

      expect(mockPrisma.vendor.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'test-org-id', isActive: true },
        orderBy: { name: 'asc' },
      });
    });
  });
});
