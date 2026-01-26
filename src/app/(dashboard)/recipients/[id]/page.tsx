export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Linkedin,
  MapPin,
  Send,
  Pencil,
  Tag,
  Calendar,
  Ban,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getRecipient } from "@/actions/recipients";

interface RecipientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipientDetailPage({ params }: RecipientDetailPageProps) {
  const { id } = await params;
  const recipient = await getRecipient(id);

  if (!recipient) {
    notFound();
  }

  const displayName = [recipient.firstName, recipient.lastName]
    .filter(Boolean)
    .join(" ") || recipient.email;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/recipients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-semibold text-primary">
                {recipient.firstName?.[0] || recipient.email[0].toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
                {recipient.doNotSend ? (
                  <Badge variant="destructive" className="gap-1">
                    <Ban className="h-3 w-3" />
                    Do Not Send
                  </Badge>
                ) : (
                  <Badge variant="default" className="gap-1">
                    <Check className="h-3 w-3" />
                    Active
                  </Badge>
                )}
              </div>
              {recipient.jobTitle && recipient.company && (
                <p className="text-muted-foreground">
                  {recipient.jobTitle} at {recipient.company}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/sends/new?recipientId=${recipient.id}`}>
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              Send Gift
            </Button>
          </Link>
          <Link href={`/recipients/${recipient.id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a href={`mailto:${recipient.email}`} className="text-primary hover:underline">
                  {recipient.email}
                </a>
              </div>
            </div>

            {recipient.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <a href={`tel:${recipient.phone}`} className="hover:underline">
                    {recipient.phone}
                  </a>
                </div>
              </div>
            )}

            {recipient.linkedinUrl && (
              <div className="flex items-center gap-3">
                <Linkedin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">LinkedIn</p>
                  <a
                    href={recipient.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            )}

            {recipient.address && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="whitespace-pre-line">{recipient.address}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recipient.company && (
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p>{recipient.company}</p>
                </div>
              </div>
            )}

            {recipient.jobTitle && (
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Job Title</p>
                  <p>{recipient.jobTitle}</p>
                </div>
              </div>
            )}

            {recipient.tags && (
              <div className="flex items-start gap-3">
                <Tag className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {recipient.tags.split(",").map((tag) => (
                      <Badge key={tag.trim()} variant="secondary">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Added</p>
                <p>{new Date(recipient.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Source</p>
              {recipient.externalSource ? (
                <Badge variant="outline">{recipient.externalSource}</Badge>
              ) : (
                <Badge variant="secondary">Manual</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {recipient.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{recipient.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Recent Sends */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Sends</CardTitle>
            <CardDescription>Gift and touch history for this recipient</CardDescription>
          </CardHeader>
          <CardContent>
            {recipient.sends && recipient.sends.length > 0 ? (
              <div className="space-y-3">
                {recipient.sends.map((send: any) => (
                  <div
                    key={send.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{send.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(send.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        send.status === "DELIVERED"
                          ? "default"
                          : send.status === "FAILED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {send.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No sends yet</p>
                <Link href={`/sends/new?recipientId=${recipient.id}`}>
                  <Button variant="link" className="mt-2">
                    Create first send
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
