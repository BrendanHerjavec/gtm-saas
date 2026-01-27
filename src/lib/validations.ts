import { z } from "zod";

// Recipient schemas
export const createRecipientSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required").max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(200).optional(),
  jobTitle: z.string().max(200).optional(),
  linkedinUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  tags: z.string().max(500).optional(),
  preferences: z.string().max(2000).optional(),
});

export const updateRecipientSchema = createRecipientSchema.partial().extend({
  doNotSend: z.boolean().optional(),
});

export type CreateRecipientInput = z.infer<typeof createRecipientSchema>;
export type UpdateRecipientInput = z.infer<typeof updateRecipientSchema>;

// Send schemas
export const sendTypeEnum = z.enum([
  "GIFT",
  "HANDWRITTEN_NOTE",
  "VIDEO",
  "EXPERIENCE",
  "DIRECT_MAIL",
]);

export const createSendSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  giftItemId: z.string().optional(),
  campaignId: z.string().optional(),
  vendorId: z.string().optional(),
  type: sendTypeEnum,
  message: z.string().max(2000, "Message is too long").optional(),
  videoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  shippingAddress: z.string().max(500).optional(),
  scheduledAt: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateSendSchema = createSendSchema.partial().extend({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "FAILED", "CANCELLED"]).optional(),
});

export type CreateSendInput = z.infer<typeof createSendSchema>;
export type UpdateSendInput = z.infer<typeof updateSendSchema>;

// Gift Item schemas
export const giftItemTypeEnum = z.enum(["PHYSICAL", "DIGITAL", "EXPERIENCE"]);

export const createGiftItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price must be positive"),
  currency: z.string().length(3).default("USD"),
  categoryId: z.string().optional(),
  vendorId: z.string().optional(),
  sku: z.string().max(100).optional(),
  type: giftItemTypeEnum.default("PHYSICAL"),
  duration: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  tags: z.string().max(500).optional(),
});

export const updateGiftItemSchema = createGiftItemSchema.partial().extend({
  inStock: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateGiftItemInput = z.infer<typeof createGiftItemSchema>;
export type UpdateGiftItemInput = z.infer<typeof updateGiftItemSchema>;

// Campaign schemas
export const campaignStatusEnum = z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"]);

export const createCampaignSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  budgetId: z.string().optional(),
  targetCount: z.coerce.number().int().min(0).optional(),
  tags: z.string().max(500).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  { message: "End date must be after start date", path: ["endDate"] }
);

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  status: campaignStatusEnum.optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

// Budget schemas
export const budgetPeriodEnum = z.enum(["MONTHLY", "QUARTERLY", "ANNUAL", "CUSTOM"]);

export const createBudgetSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  totalAmount: z.coerce.number().min(0, "Amount must be positive"),
  period: budgetPeriodEnum.default("MONTHLY"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  alertThreshold: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.endDate >= data.startDate;
    }
    return true;
  },
  { message: "End date must be after start date", path: ["endDate"] }
);

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

// Category schema
export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// Outreach Task schemas
export const taskTypeEnum = z.enum([
  "GIFT",
  "HANDWRITTEN_NOTE",
  "VIDEO",
  "EXPERIENCE",
  "DIRECT_MAIL",
]);

export const taskStatusEnum = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "SKIPPED",
]);

export const createOutreachTaskSchema = z.object({
  recipientId: z.string().min(1, "Recipient is required"),
  taskType: taskTypeEnum,
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  context: z.string().max(5000).optional(),
  priority: z.coerce.number().int().min(0).max(10).default(0),
  dueDate: z.coerce.date().optional(),
  campaignId: z.string().optional(),
  assignedToId: z.string().optional(),
});

export const updateOutreachTaskSchema = createOutreachTaskSchema.partial().extend({
  status: taskStatusEnum.optional(),
  skipReason: z.string().max(500).optional(),
});

export const completeOutreachTaskSchema = z.object({
  taskId: z.string().min(1, "Task ID is required"),
  message: z.string().max(2000).optional(),
  videoUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  giftItemId: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateOutreachTaskInput = z.infer<typeof createOutreachTaskSchema>;
export type UpdateOutreachTaskInput = z.infer<typeof updateOutreachTaskSchema>;
export type CompleteOutreachTaskInput = z.infer<typeof completeOutreachTaskSchema>;

// Helper to validate and return typed errors
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    errors[path] = err.message;
  });

  return { success: false, errors };
}
