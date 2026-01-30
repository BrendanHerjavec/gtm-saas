"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getAuthSession, hashPassword, verifyPassword } from "@/lib/auth";
import { isDemoMode } from "@/lib/demo-mode";
import { sendEmail } from "@/lib/email";

// ============================================
// Profile Settings
// ============================================

export interface UpdateProfileInput {
  name: string;
}

export async function updateProfile(input: UpdateProfileInput) {
  if (await isDemoMode()) {
    return { success: true, message: "Profile updated (demo mode)" };
  }

  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: input.name },
  });

  revalidatePath("/settings");
  return { success: true, message: "Profile updated successfully" };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(input: ChangePasswordInput) {
  if (await isDemoMode()) {
    return { success: true, message: "Password changed (demo mode)" };
  }

  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });

  if (!user?.password) {
    throw new Error("Cannot change password for OAuth accounts");
  }

  const isValid = await verifyPassword(input.currentPassword, user.password);
  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  if (input.newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }

  const hashedPassword = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword },
  });

  revalidatePath("/settings");
  return { success: true, message: "Password changed successfully" };
}

// ============================================
// Organization Settings
// ============================================

export interface UpdateOrganizationInput {
  name: string;
  slug?: string;
}

export async function updateOrganization(input: UpdateOrganizationInput) {
  if (await isDemoMode()) {
    return { success: true, message: "Organization updated (demo mode)" };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    throw new Error("Only admins can update organization settings");
  }

  // Check if slug is already taken (if changing)
  if (input.slug) {
    const existing = await prisma.organization.findFirst({
      where: {
        slug: input.slug,
        id: { not: session.user.organizationId },
      },
    });
    if (existing) {
      throw new Error("This slug is already taken");
    }
  }

  await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      name: input.name,
      ...(input.slug && { slug: input.slug }),
    },
  });

  revalidatePath("/settings");
  return { success: true, message: "Organization updated successfully" };
}

export async function getOrganization() {
  if (await isDemoMode()) {
    return {
      id: "demo-org-id",
      name: "Demo Organization",
      slug: "demo-org",
      logo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return null;
  }

  return prisma.organization.findUnique({
    where: { id: session.user.organizationId },
  });
}

// ============================================
// Team Management
// ============================================

export interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image: string | null;
  createdAt: Date;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  if (await isDemoMode()) {
    return [
      {
        id: "demo-user-id",
        name: "Demo User",
        email: "demo@example.com",
        role: "ADMIN",
        image: null,
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "demo-user-2",
        name: "Sarah Chen",
        email: "sarah@example.com",
        role: "MEMBER",
        image: null,
        createdAt: new Date("2024-02-15"),
      },
      {
        id: "demo-user-3",
        name: "Mike Johnson",
        email: "mike@example.com",
        role: "MEMBER",
        image: null,
        createdAt: new Date("2024-03-01"),
      },
    ];
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    return [];
  }

  const members = await prisma.user.findMany({
    where: { organizationId: session.user.organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return members;
}

export interface InviteTeamMemberInput {
  email: string;
  role: "ADMIN" | "MEMBER";
}

export async function inviteTeamMember(input: InviteTeamMemberInput) {
  if (await isDemoMode()) {
    return { success: true, message: "Invitation sent (demo mode)" };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Check if user is admin
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "ADMIN") {
    throw new Error("Only admins can invite team members");
  }

  // Check if email is already in use
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    if (existingUser.organizationId === session.user.organizationId) {
      throw new Error("This user is already a member of your organization");
    }
    throw new Error("This email is already registered to another organization");
  }

  // Create a new user with pending status (they'll set password on first login)
  await prisma.user.create({
    data: {
      email: input.email,
      role: input.role,
      organizationId: session.user.organizationId,
    },
  });

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { name: true },
  });

  await sendEmail({
    to: input.email,
    subject: `You've been invited to ${org?.name || "a team"} on Moments`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Team Invitation</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">You're Invited!</h1>
          <p style="color: #666; line-height: 1.6;">
            You've been invited to join <strong>${org?.name || "a team"}</strong> on Moments as a ${input.role.toLowerCase()}.
          </p>
          <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Get Started
          </a>
          <p style="color: #999; font-size: 14px;">
            Sign in with this email address to access your account.
          </p>
        </body>
      </html>
    `,
  });

  revalidatePath("/settings");
  return { success: true, message: `Invitation sent to ${input.email}` };
}

export async function updateTeamMemberRole(userId: string, role: "ADMIN" | "MEMBER") {
  if (await isDemoMode()) {
    return { success: true, message: "Role updated (demo mode)" };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Check if current user is admin
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "ADMIN") {
    throw new Error("Only admins can update roles");
  }

  // Can't change your own role
  if (userId === session.user.id) {
    throw new Error("You cannot change your own role");
  }

  // Verify the target user is in the same organization
  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      organizationId: session.user.organizationId,
    },
  });

  if (!targetUser) {
    throw new Error("User not found in your organization");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/settings");
  return { success: true, message: "Role updated successfully" };
}

export async function removeTeamMember(userId: string) {
  if (await isDemoMode()) {
    return { success: true, message: "Member removed (demo mode)" };
  }

  const session = await getAuthSession();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized");
  }

  // Check if current user is admin
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== "ADMIN") {
    throw new Error("Only admins can remove team members");
  }

  // Can't remove yourself
  if (userId === session.user.id) {
    throw new Error("You cannot remove yourself from the organization");
  }

  // Verify the target user is in the same organization
  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      organizationId: session.user.organizationId,
    },
  });

  if (!targetUser) {
    throw new Error("User not found in your organization");
  }

  // Remove from organization (don't delete, just unlink)
  await prisma.user.update({
    where: { id: userId },
    data: { organizationId: null },
  });

  revalidatePath("/settings");
  return { success: true, message: "Team member removed successfully" };
}

// ============================================
// Notification Preferences
// ============================================

export interface NotificationPreferences {
  emailNotifications: boolean;
  sendDeliveryAlerts: boolean;
  campaignUpdates: boolean;
  teamActivityAlerts: boolean;
  weeklyDigest: boolean;
  budgetAlerts: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  emailNotifications: true,
  sendDeliveryAlerts: true,
  campaignUpdates: true,
  teamActivityAlerts: false,
  weeklyDigest: true,
  budgetAlerts: true,
};

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  if (await isDemoMode()) {
    return DEFAULT_NOTIFICATION_PREFS;
  }

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return DEFAULT_NOTIFICATION_PREFS;
  }

  // For now, return defaults. In future, store in user preferences table
  // const user = await prisma.user.findUnique({
  //   where: { id: session.user.id },
  //   select: { notificationPreferences: true },
  // });
  // return user?.notificationPreferences || DEFAULT_NOTIFICATION_PREFS;

  return DEFAULT_NOTIFICATION_PREFS;
}

export async function updateNotificationPreferences(prefs: NotificationPreferences) {
  if (await isDemoMode()) {
    return { success: true, message: "Preferences updated (demo mode)" };
  }

  const session = await getAuthSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // For now, just return success. In future, store in database
  // await prisma.user.update({
  //   where: { id: session.user.id },
  //   data: { notificationPreferences: prefs },
  // });

  revalidatePath("/settings");
  return { success: true, message: "Notification preferences updated" };
}

// ============================================
// Current User Info
// ============================================

export async function getCurrentUser() {
  if (await isDemoMode()) {
    return {
      id: "demo-user-id",
      name: "Demo User",
      email: "demo@example.com",
      role: "ADMIN",
      image: null,
      hasPassword: true,
    };
  }

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      password: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image,
    hasPassword: !!user.password,
  };
}
