# GTM SaaS → Moments Hybrid Transformation TODO

## Overview
Transform the existing GTM SaaS CRM into a hybrid app combining relationship management with Moments-style high-touch engagement campaigns.

---

## Phase 1: Branding & Color Scheme
- [x] Update `src/app/globals.css` - Change CSS variables from green/teal to warm orange/amber
- [x] Update `src/components/layout/sidebar.tsx` - Change logo from "GTM" + Target icon to "Moments" + Sparkles icon
- [x] Verify colors apply throughout all components

**Color Reference (HSL):**
```css
--primary: 30 100% 50%           /* Orange */
--primary-foreground: 0 0% 100%  /* White */
--secondary: 35 100% 96%         /* Light cream */
--background: 40 50% 98%         /* Warm off-white */
```

---

## Phase 2: Marketing Landing Page
- [x] Create `src/app/(marketing)/layout.tsx` - Marketing-specific layout
- [x] Create `src/app/(marketing)/page.tsx` - Main landing page
- [x] Create `src/app/(marketing)/how-it-works/page.tsx`
- [x] Create `src/app/(marketing)/use-cases/page.tsx`
- [x] Create `src/components/marketing/navbar.tsx`
- [x] Create `src/components/marketing/hero.tsx`
- [x] Create `src/components/marketing/features.tsx`
- [x] Create `src/components/marketing/cta.tsx`
- [x] Create `src/components/marketing/footer.tsx`
- [x] Update `src/app/page.tsx` - Show landing page instead of redirect

**Landing Page Content:**
- Hero: "Outbound and customer engagement people actually remember"
- Tagline: "People respond to moments, not messages"
- How it works preview (6 steps)
- Use cases preview
- CTA buttons: "Build your first human campaign" / "See how it works"

---

## Phase 3: Marketplace Page
- [x] Create `src/app/(dashboard)/marketplace/page.tsx`
- [x] Create `src/components/features/marketplace/marketplace-header.tsx`
- [x] Create `src/components/features/marketplace/gesture-card.tsx`
- [x] Create `src/components/features/marketplace/gesture-grid.tsx`
- [x] Create `src/components/features/marketplace/category-filter.tsx`
- [x] (Optional) Add Gesture model to `prisma/schema.prisma`
- [x] (Optional) Create `src/actions/gestures.ts`

**Gesture Categories:**
| Category | Examples | Price Range |
|----------|----------|-------------|
| Sustainability | Tree Planting, Carbon Offset, Charity Donation | $15-100 |
| Food & Beverage | Local Coffee, Team Lunch, Donuts | $20-150 |
| Gifting | Custom Swag Box, Premium Gift Card | $50-250 |
| Wellness | Wellness Credit, Spa Experience | $75-300 |
| Experiences | Custom Art, Experience Credit | $100-500 |
| Personal Touch | Handwritten Note, Custom Book | $10-60 |

---

## Phase 4: Integrations Page
- [x] Create `src/app/(dashboard)/integrations/page.tsx`
- [x] Create `src/components/features/integrations/integrations-header.tsx`
- [x] Create `src/components/features/integrations/integration-card.tsx`

**Integrations to Display:**
- HubSpot (CRM sync)
- Salesforce (CRM sync)
- Slack (Notifications)
- Google Calendar
- Zapier (Automation)
- Webhooks (Custom triggers)

---

## Phase 5: Sidebar Navigation Update
- [x] Update `src/components/layout/sidebar.tsx` navigation array

**New Navigation Order:**
1. Dashboard (LayoutDashboard icon)
2. Campaigns (Zap icon) - moved up
3. Marketplace (Gift icon) - NEW
4. Leads (Users icon)
5. Contacts (UserCircle icon)
6. Companies (Building2 icon)
7. Deals (Target icon)
8. Analytics (BarChart3 icon)
9. Integrations (Plug icon) - NEW
10. Settings (Settings icon)

---

## Phase 6: Dashboard Update
- [x] Update `src/app/(dashboard)/dashboard/page.tsx`
- [x] Add welcome message: "Welcome back, [Name]"
- [x] Add prominent "New campaign" CTA button (orange gradient)
- [x] Add Moments-style metrics cards:
  - Active campaigns
  - Gestures sent
  - Replies received
  - Total spend
- [x] Keep existing CRM metrics in secondary section

---

## Phase 7: Campaign System Enhancement
- [x] Add `CampaignStep` model to schema for multi-step flows
- [x] Create visual campaign builder component
- [x] Support gesture steps alongside email steps
- [x] Add delay steps between campaign actions
- [ ] Track gesture-specific metrics (delivered, confirmed, etc.) - Future enhancement

---

## Verification Checklist
- [x] `npm run build` passes without errors
- [x] `npm run dev` runs successfully
- [x] Landing page loads at `/`
- [x] Marketplace page loads at `/marketplace`
- [x] Integrations page loads at `/integrations`
- [x] All sidebar links work correctly
- [x] Orange/amber color scheme visible throughout
- [x] Logo shows "Moments" with sparkles icon
- [x] Dashboard shows Moments-style welcome and metrics

---

## Files Summary

### New Files Created (17)
```
src/app/(marketing)/layout.tsx
src/app/(marketing)/page.tsx
src/app/(marketing)/how-it-works/page.tsx
src/app/(marketing)/use-cases/page.tsx
src/components/marketing/navbar.tsx
src/components/marketing/hero.tsx
src/components/marketing/features.tsx
src/components/marketing/cta.tsx
src/components/marketing/footer.tsx
src/app/(dashboard)/marketplace/page.tsx
src/components/features/marketplace/marketplace-header.tsx
src/components/features/marketplace/gesture-card.tsx
src/components/features/marketplace/gesture-grid.tsx
src/components/features/marketplace/category-filter.tsx
src/app/(dashboard)/integrations/page.tsx
src/components/features/integrations/integrations-header.tsx
src/components/features/integrations/integration-card.tsx
```

### Files Modified (4)
```
src/app/globals.css              - Color scheme updated
src/components/layout/sidebar.tsx - Logo + navigation updated
src/app/(dashboard)/dashboard/page.tsx - Moments-style welcome added
src/app/page.tsx                 - Removed (replaced by marketing page)
```

---

## Reference: Moments App Structure

**Public Pages:**
- `/` - Landing page with hero, features, CTA
- `/how-it-works` - 6-step explanation
- `/use-cases` - High-touch outbound, Deal acceleration, Customer onboarding, etc.
- `/marketplace` - Gesture catalog (also in dashboard)

**Dashboard Pages:**
- `/dashboard` - Welcome, active campaigns, quick stats
- `/dashboard/campaigns` - Campaign list with filters
- `/dashboard/marketplace` - Gesture selection
- `/dashboard/analytics` - Spend, meetings booked, cost per meeting
- `/dashboard/integrations` - CRM connections
- `/dashboard/settings` - Account settings

**Key UI Patterns:**
- Orange gradient CTAs
- Cream/warm white backgrounds
- Card-based layouts with subtle shadows
- Status badges (active, paused, draft, completed)
- Campaign flow visualization (Step 1 → Step 2 → Step 3)
