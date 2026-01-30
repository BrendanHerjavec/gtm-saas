// Factory functions for creating test data that matches Prisma schema

export function createMockUser(overrides: Record<string, any> = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed_password123',
    role: 'ADMIN',
    organizationId: 'org-123',
    image: null,
    emailVerified: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockOrganization(overrides: Record<string, any> = {}) {
  return {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-org',
    logo: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockRecipient(overrides: Record<string, any> = {}) {
  return {
    id: 'recipient-123',
    email: 'recipient@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    company: 'Acme Corp',
    jobTitle: 'CEO',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    address: '123 Main St',
    notes: 'Important client',
    tags: 'vip,enterprise',
    customFields: null,
    preferences: null,
    doNotSend: false,
    organizationId: 'org-123',
    externalId: null,
    externalSource: null,
    externalUrl: null,
    lastSyncedAt: null,
    syncStatus: 'SYNCED',
    crmContactId: null,
    crmIntegrationId: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockSend(overrides: Record<string, any> = {}) {
  return {
    id: 'send-123',
    recipientId: 'recipient-123',
    giftItemId: null,
    campaignId: null,
    vendorId: null,
    userId: 'user-123',
    organizationId: 'org-123',
    type: 'VIDEO',
    status: 'PENDING',
    message: 'Test message',
    videoUrl: null,
    shippingAddress: null,
    trackingNumber: null,
    trackingUrl: null,
    carrier: null,
    itemCost: 0,
    shippingCost: 0,
    totalCost: 0,
    currency: 'USD',
    scheduledAt: null,
    sentAt: null,
    deliveredAt: null,
    triggerType: 'manual',
    triggerData: null,
    externalOrderId: null,
    vendorOrderId: null,
    notes: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockOutreachTask(overrides: Record<string, any> = {}) {
  return {
    id: 'task-123',
    recipientId: 'recipient-123',
    taskType: 'VIDEO',
    title: 'Record video',
    description: 'Record personalized video',
    context: '{"notes": "Be friendly"}',
    status: 'PENDING',
    priority: 3,
    dueDate: null,
    sortOrder: 0,
    campaignId: null,
    deckId: null,
    sendId: null,
    completedAt: null,
    completedById: null,
    skipReason: null,
    assignedToId: 'user-123',
    organizationId: 'org-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockBudget(overrides: Record<string, any> = {}) {
  return {
    id: 'budget-123',
    name: 'Q1 Budget',
    type: 'QUARTERLY',
    amount: 10000,
    spent: 2500,
    currency: 'USD',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31'),
    alertThreshold: 80,
    alertSent: false,
    organizationId: 'org-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createMockGiftItem(overrides: Record<string, any> = {}) {
  return {
    id: 'gift-123',
    name: 'Coffee Gift Card',
    description: 'A nice coffee gift card',
    imageUrl: null,
    price: 25.0,
    currency: 'USD',
    categoryId: null,
    vendorId: null,
    sku: null,
    inStock: true,
    isActive: true,
    type: 'DIGITAL',
    duration: null,
    location: null,
    tags: null,
    customFields: null,
    organizationId: 'org-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}
