import { describe, it, expect, beforeEach } from 'vitest';
import { revalidatePath } from 'next/cache';

// Import mocks (must be before importing the module under test)
import { mockPrisma } from '@/__tests__/mocks/prisma';
import { mockGetAuthSession, mockAuthSession, mockMemberSession, mockVerifyPassword, mockHashPassword } from '@/__tests__/mocks/auth';
import { mockIsDemoMode } from '@/__tests__/mocks/demo-mode';
import { mockSendEmail } from '@/__tests__/mocks/email';
import { createMockUser, createMockOrganization } from '@/__tests__/factories';

// Import actions under test
import {
  inviteTeamMember,
  changePassword,
  updateTeamMemberRole,
  removeTeamMember,
  getTeamMembers,
  updateProfile,
  getOrganization,
} from '../settings';

describe('settings actions', () => {
  beforeEach(() => {
    mockIsDemoMode.mockResolvedValue(false);
    mockGetAuthSession.mockResolvedValue(mockAuthSession);
  });

  // ==========================================
  // inviteTeamMember
  // ==========================================
  describe('inviteTeamMember', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        inviteTeamMember({ email: 'new@example.com', role: 'MEMBER' })
      ).rejects.toThrow('Unauthorized');
    });

    it('throws when user is not admin', async () => {
      mockGetAuthSession.mockResolvedValue(mockMemberSession);
      mockPrisma.user.findUnique.mockResolvedValueOnce({ role: 'MEMBER' });

      await expect(
        inviteTeamMember({ email: 'new@example.com', role: 'MEMBER' })
      ).rejects.toThrow('Only admins can invite team members');
    });

    it('throws when email already exists in same org', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' }) // current user check
        .mockResolvedValueOnce({ email: 'existing@test.com', organizationId: 'test-org-id' }); // email check

      await expect(
        inviteTeamMember({ email: 'existing@test.com', role: 'MEMBER' })
      ).rejects.toThrow('This user is already a member of your organization');
    });

    it('throws when email exists in different org', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' })
        .mockResolvedValueOnce({ email: 'other@test.com', organizationId: 'other-org-id' });

      await expect(
        inviteTeamMember({ email: 'other@test.com', role: 'MEMBER' })
      ).rejects.toThrow('This email is already registered to another organization');
    });

    it('creates user and sends email on success', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ role: 'ADMIN' })
        .mockResolvedValueOnce(null); // no existing user
      mockPrisma.user.create.mockResolvedValue(createMockUser({ email: 'new@test.com', role: 'MEMBER' }));
      mockPrisma.organization.findUnique.mockResolvedValue(createMockOrganization({ name: 'My Org' }));

      const result = await inviteTeamMember({ email: 'new@test.com', role: 'MEMBER' });

      expect(result.success).toBe(true);
      expect(result.message).toContain('new@test.com');

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@test.com',
          role: 'MEMBER',
          organizationId: 'test-org-id',
        },
      });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'new@test.com',
          subject: expect.stringContaining('My Org'),
        })
      );

      expect(revalidatePath).toHaveBeenCalledWith('/settings');
    });

    it('returns success in demo mode without DB calls', async () => {
      mockIsDemoMode.mockResolvedValue(true);

      const result = await inviteTeamMember({ email: 'demo@test.com', role: 'MEMBER' });

      expect(result.success).toBe(true);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockSendEmail).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // changePassword
  // ==========================================
  describe('changePassword', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        changePassword({ currentPassword: 'old', newPassword: 'newpass123' })
      ).rejects.toThrow('Unauthorized');
    });

    it('throws for OAuth accounts without password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ password: null });

      await expect(
        changePassword({ currentPassword: 'old', newPassword: 'newpass123' })
      ).rejects.toThrow('Cannot change password for OAuth accounts');
    });

    it('throws when current password is incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ password: 'hashed_correctpass' });
      mockVerifyPassword.mockResolvedValue(false);

      await expect(
        changePassword({ currentPassword: 'wrongpass', newPassword: 'newpass123' })
      ).rejects.toThrow('Current password is incorrect');
    });

    it('throws when new password is too short', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ password: 'hashed_oldpass' });
      mockVerifyPassword.mockResolvedValue(true);

      await expect(
        changePassword({ currentPassword: 'oldpass', newPassword: 'short' })
      ).rejects.toThrow('New password must be at least 8 characters');
    });

    it('changes password successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ password: 'hashed_oldpass' });
      mockVerifyPassword.mockResolvedValue(true);
      mockHashPassword.mockResolvedValue('hashed_newpass123');
      mockPrisma.user.update.mockResolvedValue({});

      const result = await changePassword({ currentPassword: 'oldpass', newPassword: 'newpass123' });

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { password: 'hashed_newpass123' },
      });
      expect(revalidatePath).toHaveBeenCalledWith('/settings');
    });

    it('returns success in demo mode', async () => {
      mockIsDemoMode.mockResolvedValue(true);

      const result = await changePassword({ currentPassword: 'x', newPassword: 'y' });

      expect(result.success).toBe(true);
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // updateTeamMemberRole
  // ==========================================
  describe('updateTeamMemberRole', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(
        updateTeamMemberRole('user-2', 'MEMBER')
      ).rejects.toThrow('Unauthorized');
    });

    it('throws when not admin', async () => {
      mockGetAuthSession.mockResolvedValue(mockMemberSession);
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'MEMBER' });

      await expect(
        updateTeamMemberRole('user-2', 'ADMIN')
      ).rejects.toThrow('Only admins can update roles');
    });

    it('throws when trying to change own role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      await expect(
        updateTeamMemberRole('test-user-id', 'MEMBER')
      ).rejects.toThrow('You cannot change your own role');
    });

    it('throws when target user not in same org', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        updateTeamMemberRole('unknown-user', 'MEMBER')
      ).rejects.toThrow('User not found in your organization');
    });

    it('updates role successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
      mockPrisma.user.findFirst.mockResolvedValue(createMockUser({ id: 'user-2', role: 'MEMBER' }));
      mockPrisma.user.update.mockResolvedValue({});

      const result = await updateTeamMemberRole('user-2', 'ADMIN');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { role: 'ADMIN' },
      });
    });

    it('returns success in demo mode', async () => {
      mockIsDemoMode.mockResolvedValue(true);

      const result = await updateTeamMemberRole('user-2', 'ADMIN');
      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // removeTeamMember
  // ==========================================
  describe('removeTeamMember', () => {
    it('throws when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      await expect(removeTeamMember('user-2')).rejects.toThrow('Unauthorized');
    });

    it('throws when not admin', async () => {
      mockGetAuthSession.mockResolvedValue(mockMemberSession);
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'MEMBER' });

      await expect(removeTeamMember('user-2')).rejects.toThrow('Only admins can remove team members');
    });

    it('throws when trying to remove self', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });

      await expect(removeTeamMember('test-user-id')).rejects.toThrow(
        'You cannot remove yourself from the organization'
      );
    });

    it('sets organizationId to null (soft remove)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
      mockPrisma.user.findFirst.mockResolvedValue(createMockUser({ id: 'user-2' }));
      mockPrisma.user.update.mockResolvedValue({});

      const result = await removeTeamMember('user-2');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { organizationId: null },
      });
    });
  });

  // ==========================================
  // getTeamMembers
  // ==========================================
  describe('getTeamMembers', () => {
    it('returns empty array when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getTeamMembers();
      expect(result).toEqual([]);
    });

    it('returns members scoped to org', async () => {
      const members = [
        createMockUser({ id: '1', name: 'Alice', role: 'ADMIN' }),
        createMockUser({ id: '2', name: 'Bob', role: 'MEMBER' }),
      ];
      mockPrisma.user.findMany.mockResolvedValue(members);

      const result = await getTeamMembers();

      expect(result).toEqual(members);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'test-org-id' },
        })
      );
    });
  });

  // ==========================================
  // updateProfile
  // ==========================================
  describe('updateProfile', () => {
    it('updates name successfully', async () => {
      mockPrisma.user.update.mockResolvedValue({});

      const result = await updateProfile({ name: 'New Name' });

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
        data: { name: 'New Name' },
      });
    });
  });

  // ==========================================
  // getOrganization
  // ==========================================
  describe('getOrganization', () => {
    it('returns null when unauthenticated', async () => {
      mockGetAuthSession.mockResolvedValue(null);

      const result = await getOrganization();
      expect(result).toBeNull();
    });

    it('returns org data when authenticated', async () => {
      const org = createMockOrganization();
      mockPrisma.organization.findUnique.mockResolvedValue(org);

      const result = await getOrganization();

      expect(mockPrisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-org-id' },
      });
    });
  });
});
