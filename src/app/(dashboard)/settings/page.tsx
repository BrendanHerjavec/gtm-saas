export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";
import {
  getCurrentUser,
  getOrganization,
  getTeamMembers,
  getNotificationPreferences,
} from "@/actions/settings";

export default async function SettingsPage() {
  const [user, organization, teamMembers, notificationPrefs] = await Promise.all([
    getCurrentUser(),
    getOrganization(),
    getTeamMembers(),
    getNotificationPreferences(),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <SettingsClient
      initialUser={user}
      initialOrganization={organization}
      initialTeamMembers={teamMembers}
      initialNotificationPrefs={notificationPrefs}
    />
  );
}
