"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Gift, FileText, Video, Calendar, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSend } from "@/actions/sends";
import { createSendSchema, type CreateSendInput } from "@/lib/validations";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Recipient = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
};

type GiftItem = {
  id: string;
  name: string;
  price: number;
  type: string;
};

type Campaign = {
  id: string;
  name: string;
};

interface SendFormProps {
  recipients: Recipient[];
  giftItems: GiftItem[];
  campaigns: Campaign[];
  onSuccess?: () => void;
}

const sendTypes = [
  { value: "GIFT", label: "Gift", icon: Gift, description: "Send a physical or digital gift" },
  { value: "HANDWRITTEN_NOTE", label: "Handwritten Note", icon: FileText, description: "Personalized handwritten message" },
  { value: "VIDEO", label: "Video Message", icon: Video, description: "Custom video message" },
  { value: "EXPERIENCE", label: "Experience", icon: Calendar, description: "Dinner, event, or experience" },
  { value: "DIRECT_MAIL", label: "Direct Mail", icon: Mail, description: "Physical mail piece" },
] as const;

export function SendForm({ recipients, giftItems, campaigns, onSuccess }: SendFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("GIFT");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateSendInput>({
    resolver: zodResolver(createSendSchema),
    defaultValues: {
      type: "GIFT",
      recipientId: "",
      message: "",
    },
  });

  const watchedGiftItemId = watch("giftItemId");
  const selectedGiftItem = giftItems.find((item) => item.id === watchedGiftItemId);

  const onSubmit = async (data: CreateSendInput) => {
    setIsLoading(true);
    try {
      await createSend({
        ...data,
        type: selectedType,
      });
      toast({
        title: "Send created",
        description: "Your send has been queued for processing.",
        variant: "success",
      });
      router.push("/sends");
      router.refresh();
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create send",
        description: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Send Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Send Type</CardTitle>
          <CardDescription>Choose what type of touch you want to send</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {sendTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setSelectedType(type.value);
                    setValue("type", type.value as CreateSendInput["type"]);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors",
                    selectedType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  )}
                >
                  <Icon className={cn(
                    "h-6 w-6",
                    selectedType === type.value ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    selectedType === type.value ? "text-primary" : "text-muted-foreground"
                  )}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recipient Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Recipient</CardTitle>
          <CardDescription>Select who will receive this send</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientId">Recipient *</Label>
            <Select
              onValueChange={(value) => setValue("recipientId", value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a recipient" />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((recipient) => (
                  <SelectItem key={recipient.id} value={recipient.id}>
                    <div className="flex flex-col">
                      <span>
                        {recipient.firstName} {recipient.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {recipient.email} {recipient.company && `- ${recipient.company}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.recipientId && (
              <p className="text-sm text-destructive">{errors.recipientId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingAddress">Shipping Address</Label>
            <Textarea
              id="shippingAddress"
              placeholder="Enter shipping address if different from recipient's default"
              {...register("shippingAddress")}
              disabled={isLoading}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Gift Selection (for GIFT type) */}
      {(selectedType === "GIFT" || selectedType === "EXPERIENCE") && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedType === "GIFT" ? "Gift Item" : "Experience"}</CardTitle>
            <CardDescription>
              {selectedType === "GIFT"
                ? "Select an item from your catalog"
                : "Choose an experience to send"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="giftItemId">Item</Label>
              <Select
                onValueChange={(value) => setValue("giftItemId", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {giftItems
                    .filter((item) =>
                      selectedType === "EXPERIENCE"
                        ? item.type === "EXPERIENCE"
                        : item.type !== "EXPERIENCE"
                    )
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex justify-between items-center gap-4 w-full">
                          <span>{item.name}</span>
                          <span className="text-muted-foreground">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {selectedGiftItem && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm">
                  Selected: <strong>{selectedGiftItem.name}</strong> - ${selectedGiftItem.price.toFixed(2)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Video URL (for VIDEO type) */}
      {selectedType === "VIDEO" && (
        <Card>
          <CardHeader>
            <CardTitle>Video Message</CardTitle>
            <CardDescription>Provide a link to your personalized video</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://www.loom.com/share/..."
                {...register("videoUrl")}
                disabled={isLoading}
              />
              {errors.videoUrl && (
                <p className="text-sm text-destructive">{errors.videoUrl.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message */}
      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
          <CardDescription>Add a personalized message to accompany your send</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Personal Message</Label>
            <Textarea
              id="message"
              placeholder={
                selectedType === "HANDWRITTEN_NOTE"
                  ? "Write your handwritten note message here..."
                  : "Add a personal message to include with your send..."
              }
              {...register("message")}
              disabled={isLoading}
              rows={4}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add internal notes (not visible to recipient)"
              {...register("notes")}
              disabled={isLoading}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Campaign & Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign & Scheduling</CardTitle>
          <CardDescription>Optionally link to a campaign or schedule for later</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaignId">Campaign (optional)</Label>
              <Select
                onValueChange={(value) => setValue("campaignId", value === "none" ? undefined : value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Campaign</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Schedule Send (optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                {...register("scheduledAt")}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
          Create Send
        </Button>
      </div>
    </form>
  );
}
