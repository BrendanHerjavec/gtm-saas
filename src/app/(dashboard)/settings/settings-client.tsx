"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Building2,
  Bell,
  Plug,
  Loader2,
  Check,
  UserPlus,
  Shield,
  UserMinus,
  Mail,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  updateProfile,
  changePassword,
  updateOrganization,
  getTeamMembers,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  updateNotificationPreferences,
  type TeamMember,
  type NotificationPreferences,
} from "@/actions/settings";
import Link from "next/link";

interface SettingsClientProps {
  initialUser: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    image: string | null;
    hasPassword: boolean;
  };
  initialOrganization: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  } | null;
  initialTeamMembers: TeamMember[];
  initialNotificationPrefs: NotificationPreferences;
}

export function SettingsClient({
  initialUser,
  initialOrganization,
  initialTeamMembers,
  initialNotificationPrefs,
}: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile state
  const [name, setName] = useState(initialUser.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Organization state
  const [orgName, setOrgName] = useState(initialOrganization?.name || "");
  const [orgSlug, setOrgSlug] = useState(initialOrganization?.slug || "");

  // Team state
  const [teamMembers, setTeamMembers] = useState(initialTeamMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Notification state
  const [notificationPrefs, setNotificationPrefs] = useState(initialNotificationPrefs);

  const isAdmin = initialUser.role === "ADMIN";

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProfile = () => {
    startTransition(async () => {
      try {
        await updateProfile({ name });
        showMessage("success", "Profile updated successfully");
      } catch (error) {
        showMessage("error", error instanceof Error ? error.message : "Failed to update profile");
      }
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) {
      showMessage("error", "Please fill in both password fields");
      return;
    }
    startTransition(async () => {
      try {
        await changePassword({ currentPassword, newPassword });
        setCurrentPassword("");
        setNewPassword("");
        showMessage("success", "Password changed successfully");
      } catch (error) {
        showMessage("error", error instanceof Error ? error.message : "Failed to change password");
      }
    });
  };

  const handleSaveOrganization = () => {
    startTransition(async () => {
      try {
        await updateOrganization({ name: orgName, slug: orgSlug });
        showMessage("success", "Organization updated successfully");
      } catch (error) {
        showMessage("error", error instanceof Error ? error.message : "Failed to update organization");
      }
    });
  };

  const handleInviteMember = () => {
    if (!inviteEmail) {
      showMessage("error", "Please enter an email address");
      return;
    }
    startTransition(async () => {
      try {
        await inviteTeamMember({ email: inviteEmail, role: inviteRole });
        setInviteEmail("");
        setInviteRole("MEMBER");
        setInviteDialogOpen(false);
        // Refresh team members
        const members = await getTeamMembers();
        setTeamMembers(members);
        showMessage("success", `Invitation sent to ${inviteEmail}`);
      } catch (error) {
        showMessage("error", error instanceof Error ? error.message : "Failed to invite member");
      }
    });
  };

  const handleUpdateRole = (userId: string, role: "ADMIN" | "MEMBER") => {
    startTransition(async () => {
      try {
        await updateTeamMemberRole(userId, role);
        const members = await getTeamMembers();
        setTeamMembers(members);
        showMessage("success", "Role updated successfully");
      } catch (error) {
        showMessage("error", error instanceof Error ? error.message : "Failed to update role");
      }
    });
  };

  const handleRemoveMember = (userId: string) => {
    startTransition(async () => {
      try {
        await removeTeamMember(userId);
        const members = await getTeamMembers();
        setTeamMembers(members);
        showMessage("success", "Team member removed");
      } catch (error) {
        showMessage("error", error instanceof Error ? error.message : "Failed to remove member");
      }
    });
  };

  const handleNotificationChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    startTransition(async () => {
      try {
        await updateNotificationPreferences(newPrefs);
      } catch (error) {
        // Revert on error
        setNotificationPrefs(notificationPrefs);
        showMessage("error", error instanceof Error ? error.message : "Failed to update preferences");
      }
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and organization settings
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg text-sm",
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          )}
        >
          {message.type === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            <span className="font-medium">Error:</span>
          )}
          {message.text}
        </div>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={initialUser.email || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Profile
                </Button>
              </div>

              <Separator />

              {initialUser.hasPassword && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={handleChangePassword}
                      disabled={isPending || !currentPassword || !newPassword}
                    >
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Change Password
                    </Button>
                  </div>
                </div>
              )}

              {!initialUser.hasPassword && (
                <div className="rounded-lg border border-muted p-4">
                  <p className="text-sm text-muted-foreground">
                    You signed in with a social provider. Password management is not available.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>
                  Manage your organization details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Acme Inc."
                      disabled={!isAdmin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                      placeholder="acme-inc"
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                {isAdmin ? (
                  <div className="flex justify-end">
                    <Button onClick={handleSaveOrganization} disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Organization
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Only admins can update organization settings.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                      Manage your team ({teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""})
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Invite Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                          <DialogDescription>
                            Send an invitation to join your organization.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="inviteEmail">Email Address</Label>
                            <Input
                              id="inviteEmail"
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="colleague@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inviteRole">Role</Label>
                            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "ADMIN" | "MEMBER")}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MEMBER">Member</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Admins can manage team members and organization settings.
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleInviteMember} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Invitation
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.image || undefined} />
                          <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {member.name || "Pending User"}
                              {member.id === initialUser.id && (
                                <span className="text-muted-foreground ml-1">(you)</span>
                              )}
                            </span>
                            {member.role === "ADMIN" && (
                              <Badge variant="secondary" className="gap-1">
                                <Crown className="h-3 w-3" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </div>
                        </div>
                      </div>

                      {isAdmin && member.id !== initialUser.id && (
                        <div className="flex items-center gap-2">
                          <Select
                            value={member.role}
                            onValueChange={(v) => handleUpdateRole(member.id, v as "ADMIN" | "MEMBER")}
                          >
                            <SelectTrigger className="w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MEMBER">Member</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove {member.name || member.email} from your organization?
                                  They will lose access to all organization data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.emailNotifications}
                    onCheckedChange={(v) => handleNotificationChange("emailNotifications", v)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Send Delivery Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when gifts are delivered
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.sendDeliveryAlerts}
                    onCheckedChange={(v) => handleNotificationChange("sendDeliveryAlerts", v)}
                    disabled={!notificationPrefs.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Campaign Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates on campaign progress
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.campaignUpdates}
                    onCheckedChange={(v) => handleNotificationChange("campaignUpdates", v)}
                    disabled={!notificationPrefs.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Team Activity Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified of team member actions
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.teamActivityAlerts}
                    onCheckedChange={(v) => handleNotificationChange("teamActivityAlerts", v)}
                    disabled={!notificationPrefs.emailNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Digest</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive a weekly summary of activity
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.weeklyDigest}
                    onCheckedChange={(v) => handleNotificationChange("weeklyDigest", v)}
                    disabled={!notificationPrefs.emailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Budget Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when approaching budget limits
                    </p>
                  </div>
                  <Switch
                    checked={notificationPrefs.budgetAlerts}
                    onCheckedChange={(v) => handleNotificationChange("budgetAlerts", v)}
                    disabled={!notificationPrefs.emailNotifications}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect with CRMs and third-party services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Manage your CRM and service integrations from the dedicated integrations page.
                </p>
                <Link href="/integrations">
                  <Button>
                    <Plug className="mr-2 h-4 w-4" />
                    Go to Integrations
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
