"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createGiftItem, updateGiftItem } from "@/actions/catalog";
import { createGiftItemSchema, type CreateGiftItemInput } from "@/lib/validations";
import { Loader2, Gift, DollarSign, Tag, Package } from "lucide-react";

type GiftItem = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  categoryId: string | null;
  vendorId: string | null;
  sku: string | null;
  type: string;
  duration: string | null;
  location: string | null;
  tags: string | null;
  inStock: boolean;
  isActive: boolean;
};

type Category = {
  id: string;
  name: string;
};

type Vendor = {
  id: string;
  name: string;
};

interface GiftItemFormProps {
  giftItem?: GiftItem | null;
  categories: Category[];
  vendors: Vendor[];
  onSuccess?: () => void;
}

export function GiftItemForm({ giftItem, categories, vendors, onSuccess }: GiftItemFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inStock, setInStock] = useState(giftItem?.inStock ?? true);
  const [isActive, setIsActive] = useState(giftItem?.isActive ?? true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateGiftItemInput>({
    resolver: zodResolver(createGiftItemSchema),
    defaultValues: {
      name: giftItem?.name || "",
      description: giftItem?.description || "",
      imageUrl: giftItem?.imageUrl || "",
      price: giftItem?.price || 0,
      currency: giftItem?.currency || "USD",
      categoryId: giftItem?.categoryId || undefined,
      vendorId: giftItem?.vendorId || undefined,
      sku: giftItem?.sku || "",
      type: (giftItem?.type as "PHYSICAL" | "DIGITAL" | "EXPERIENCE") || "PHYSICAL",
      duration: giftItem?.duration || "",
      location: giftItem?.location || "",
      tags: giftItem?.tags || "",
    },
  });

  const selectedType = watch("type");

  const onSubmit = async (data: CreateGiftItemInput) => {
    setIsSubmitting(true);
    try {
      if (giftItem) {
        await updateGiftItem(giftItem.id, {
          ...data,
          inStock,
          isActive,
        });
        toast({
          title: "Gift item updated",
          description: `"${data.name}" has been updated.`,
          variant: "success",
        });
      } else {
        await createGiftItem(data);
        toast({
          title: "Gift item created",
          description: `"${data.name}" has been added to your catalog.`,
          variant: "success",
        });
      }
      onSuccess?.();
      router.push("/catalog");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Name and description of the gift item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Premium Coffee Gift Set"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="A curated selection of premium coffee beans..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                {...register("imageUrl")}
                placeholder="https://example.com/image.jpg"
              />
              {errors.imageUrl && (
                <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing & Type
            </CardTitle>
            <CardDescription>Set pricing and item type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("price")}
                  placeholder="49.99"
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  defaultValue={giftItem?.currency || "USD"}
                  onValueChange={(value) => setValue("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Item Type *</Label>
              <Select
                defaultValue={giftItem?.type || "PHYSICAL"}
                onValueChange={(value) => setValue("type", value as "PHYSICAL" | "DIGITAL" | "EXPERIENCE")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHYSICAL">Physical Item</SelectItem>
                  <SelectItem value="DIGITAL">Digital Item</SelectItem>
                  <SelectItem value="EXPERIENCE">Experience</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedType === "EXPERIENCE" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    {...register("duration")}
                    placeholder="2 hours"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    {...register("location")}
                    placeholder="San Francisco, CA"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                {...register("sku")}
                placeholder="GIFT-001"
              />
            </div>
          </CardContent>
        </Card>

        {/* Organization & Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Organization
            </CardTitle>
            <CardDescription>Categorize and organize the item</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                defaultValue={giftItem?.categoryId || ""}
                onValueChange={(value) => setValue("categoryId", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor</Label>
              <Select
                defaultValue={giftItem?.vendorId || ""}
                onValueChange={(value) => setValue("vendorId", value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No vendor</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                {...register("tags")}
                placeholder="coffee, premium, gift set"
              />
              <p className="text-xs text-muted-foreground">
                Separate tags with commas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Status
            </CardTitle>
            <CardDescription>Availability settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="inStock">In Stock</Label>
                <p className="text-sm text-muted-foreground">
                  Item is available for sending
                </p>
              </div>
              <Switch
                id="inStock"
                checked={inStock}
                onCheckedChange={setInStock}
              />
            </div>

            {giftItem && (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Show in catalog
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {giftItem ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </form>
  );
}
