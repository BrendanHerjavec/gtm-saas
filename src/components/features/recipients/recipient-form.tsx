"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createRecipient, updateRecipient } from "@/actions/recipients";
import { createRecipientSchema, type CreateRecipientInput } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";

type Recipient = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  linkedinUrl: string | null;
  address: string | null;
  notes: string | null;
  tags: string | null;
  doNotSend: boolean;
};

interface RecipientFormProps {
  recipient?: Recipient;
  onSuccess?: () => void;
}

export function RecipientForm({ recipient, onSuccess }: RecipientFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [doNotSend, setDoNotSend] = useState(recipient?.doNotSend || false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRecipientInput>({
    resolver: zodResolver(createRecipientSchema),
    defaultValues: {
      email: recipient?.email || "",
      firstName: recipient?.firstName || "",
      lastName: recipient?.lastName || "",
      phone: recipient?.phone || "",
      company: recipient?.company || "",
      jobTitle: recipient?.jobTitle || "",
      linkedinUrl: recipient?.linkedinUrl || "",
      address: recipient?.address || "",
      notes: recipient?.notes || "",
      tags: recipient?.tags || "",
    },
  });

  const onSubmit = async (data: CreateRecipientInput) => {
    setIsLoading(true);
    try {
      if (recipient) {
        await updateRecipient(recipient.id, { ...data, doNotSend });
        toast({
          title: "Recipient updated",
          description: "The recipient has been updated successfully.",
          variant: "success",
        });
      } else {
        await createRecipient(data);
        toast({
          title: "Recipient created",
          description: "The recipient has been added successfully.",
          variant: "success",
        });
      }
      router.push("/recipients");
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: recipient ? "Failed to update recipient" : "Failed to create recipient",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Enter the recipient's contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                {...register("firstName")}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register("lastName")}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@company.com"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              {...register("phone")}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Add professional details for personalization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Acme Inc."
                {...register("company")}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="VP of Sales"
                {...register("jobTitle")}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              type="url"
              placeholder="https://linkedin.com/in/johndoe"
              {...register("linkedinUrl")}
              disabled={isLoading}
            />
            {errors.linkedinUrl && (
              <p className="text-sm text-destructive">{errors.linkedinUrl.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Address & Notes</CardTitle>
          <CardDescription>Shipping address and additional information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Shipping Address</Label>
            <Textarea
              id="address"
              placeholder="123 Main St, Suite 100&#10;San Francisco, CA 94105"
              {...register("address")}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="vip, enterprise, q1-target"
              {...register("tags")}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated tags for organization
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any relevant notes about this recipient..."
              {...register("notes")}
              disabled={isLoading}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      {recipient && (
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="doNotSend"
                checked={doNotSend}
                onCheckedChange={(checked) => setDoNotSend(checked as boolean)}
              />
              <label
                htmlFor="doNotSend"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Do Not Send
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              When enabled, this recipient will not receive any automated sends
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {recipient ? "Update Recipient" : "Add Recipient"}
        </Button>
      </div>
    </form>
  );
}
