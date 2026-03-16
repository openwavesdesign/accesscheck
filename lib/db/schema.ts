import { pgTable, text, uuid, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  // active | canceled | past_due | trialing | none
  status: text('status').notNull().default('none'),
  // starter | pro
  planId: text('plan_id'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const scans = pgTable('scans', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull(),
  baseUrl: text('base_url').notNull(),
  // pending | running | complete | failed
  status: text('status').notNull().default('pending'),
  pagesTotal: integer('pages_total').notNull().default(0),
  pagesCrawled: integer('pages_crawled').notNull().default(0),
  overallGrade: text('overall_grade'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const scanPages = pgTable('scan_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  scanId: uuid('scan_id').notNull().references(() => scans.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  grade: text('grade').notNull(),
  score: integer('score').notNull(),
  checks: jsonb('checks').notNull(),
  crawledAt: timestamp('crawled_at', { withTimezone: true }).notNull().defaultNow(),
});
