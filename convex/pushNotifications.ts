import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// VAPID keys from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noreply@loweffort.bet";

// Get user's push subscriptions
export const getUserSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user_and_active", (q) => 
        q.eq("userId", userId).eq("isActive", true)
      )
      .collect();

    return subscriptions;
  },
});

// Subscribe to push notifications
export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    p256dhKey: v.string(),
    authKey: v.string(),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const now = Date.now();

    // Check if subscription already exists
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        userId,
        p256dhKey: args.p256dhKey,
        authKey: args.authKey,
        updatedAt: now,
        userAgent: args.userAgent,
        isActive: true,
      });
      return existing._id;
    } else {
      // Create new subscription
      const subscriptionId = await ctx.db.insert("pushSubscriptions", {
        userId,
        endpoint: args.endpoint,
        p256dhKey: args.p256dhKey,
        authKey: args.authKey,
        createdAt: now,
        updatedAt: now,
        userAgent: args.userAgent,
        isActive: true,
      });
      return subscriptionId;
    }
  },
});

// Unsubscribe from push notifications
export const unsubscribe = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (subscription && subscription.userId === userId) {
      await ctx.db.patch(subscription._id, {
        isActive: false,
        updatedAt: Date.now(),
      });
    }
  },
});

// Get user's notification preferences
export const getNotificationPreferences = query({
  args: {
    leagueId: v.optional(v.id("leagues")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user_and_league", (q) => 
        q.eq("userId", userId).eq("leagueId", args.leagueId)
      )
      .first();

    // Return default preferences if none exist
    if (!preferences) {
      return {
        enableChatMessages: true,
        enableDraftPicks: true,
        enableMyTurn: true,
        enableImportantOnly: false,
        mutedUntil: null,
      };
    }

    return {
      enableChatMessages: preferences.enableChatMessages,
      enableDraftPicks: preferences.enableDraftPicks,
      enableMyTurn: preferences.enableMyTurn,
      enableImportantOnly: preferences.enableImportantOnly,
      mutedUntil: preferences.mutedUntil,
    };
  },
});

// Update notification preferences
export const updateNotificationPreferences = mutation({
  args: {
    leagueId: v.optional(v.id("leagues")),
    enableChatMessages: v.optional(v.boolean()),
    enableDraftPicks: v.optional(v.boolean()),
    enableMyTurn: v.optional(v.boolean()),
    enableImportantOnly: v.optional(v.boolean()),
    mutedUntil: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const now = Date.now();

    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user_and_league", (q) => 
        q.eq("userId", userId).eq("leagueId", args.leagueId)
      )
      .first();

    const updates = {
      ...(args.enableChatMessages !== undefined && { enableChatMessages: args.enableChatMessages }),
      ...(args.enableDraftPicks !== undefined && { enableDraftPicks: args.enableDraftPicks }),
      ...(args.enableMyTurn !== undefined && { enableMyTurn: args.enableMyTurn }),
      ...(args.enableImportantOnly !== undefined && { enableImportantOnly: args.enableImportantOnly }),
      ...(args.mutedUntil !== undefined && { mutedUntil: args.mutedUntil }),
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    } else {
      const preferencesId = await ctx.db.insert("notificationPreferences", {
        userId,
        leagueId: args.leagueId,
        enableChatMessages: args.enableChatMessages ?? true,
        enableDraftPicks: args.enableDraftPicks ?? true,
        enableMyTurn: args.enableMyTurn ?? true,
        enableImportantOnly: args.enableImportantOnly ?? false,
        mutedUntil: args.mutedUntil,
        createdAt: now,
        updatedAt: now,
      });
      return preferencesId;
    }
  },
});

// Send push notification action - delegates to Node.js runtime for web-push API
export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    icon: v.optional(v.string()),
    badge: v.optional(v.string()),
    tag: v.optional(v.string()),
    data: v.optional(v.record(v.string(), v.any())),
    actions: v.optional(v.array(v.object({
      action: v.string(),
      title: v.string(),
      icon: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args): Promise<{ sent: number; failed: number; errors?: string[]; totalSubscriptions?: number }> => {
    // Convert data format for Node.js action
    const nodeData = args.data ? {
      type: args.data.type || "notification",
      leagueId: args.data.leagueId,
      messageId: args.data.messageId,
      activityType: args.data.activityType,
      url: args.data.url,
      timestamp: args.data.timestamp,
    } : undefined;

    // Delegate to Node.js runtime action for actual push notification sending
    return await ctx.runAction(api.lib.pushNotificationSender.sendPushNotificationNode, {
      userId: args.userId,
      title: args.title,
      body: args.body,
      icon: args.icon,
      badge: args.badge,
      tag: args.tag,
      data: nodeData,
      actions: args.actions,
    });
  },
});

// Log notification delivery attempt
export const logNotificationDelivery = mutation({
  args: {
    userId: v.id("users"),
    subscriptionId: v.id("pushSubscriptions"),
    title: v.string(),
    body: v.string(),
    type: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
    leagueId: v.optional(v.id("leagues")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notificationDeliveries", {
      userId: args.userId,
      subscriptionId: args.subscriptionId,
      title: args.title,
      body: args.body,
      type: args.type,
      status: args.status,
      errorMessage: args.errorMessage,
      leagueId: args.leagueId,
      sentAt: Date.now(),
    });
  },
});

// Get notification delivery statistics
export const getNotificationStats = query({
  args: {
    userId: v.optional(v.id("users")),
    leagueId: v.optional(v.id("leagues")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");
    
    // Only allow users to see their own stats for now
    const targetUserId = args.userId || userId;
    if (targetUserId !== userId) {
      throw new Error("Access denied");
    }

    // Build the appropriate query based on filters
    let deliveries;
    
    if (args.leagueId) {
      deliveries = await ctx.db
        .query("notificationDeliveries")
        .withIndex("by_league", q => q.eq("leagueId", args.leagueId))
        .order("desc")
        .take(args.limit || 50);
    } else if (targetUserId) {
      deliveries = await ctx.db
        .query("notificationDeliveries")
        .withIndex("by_user", q => q.eq("userId", targetUserId))
        .order("desc")
        .take(args.limit || 50);
    } else {
      deliveries = await ctx.db
        .query("notificationDeliveries")
        .order("desc")
        .take(args.limit || 50);
    }

    // Calculate stats
    const total = deliveries.length;
    const sent = deliveries.filter(d => d.status === "sent").length;
    const failed = deliveries.filter(d => d.status === "failed").length;
    
    return {
      deliveries,
      stats: {
        total,
        sent,
        failed,
        successRate: total > 0 ? (sent / total) : 0,
      }
    };
  },
});

// Internal query to get user subscriptions (for actions)
export const getUserSubscriptionsInternal = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user_and_active", (q) => 
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    return subscriptions;
  },
});

// Deactivate invalid subscription
export const deactivateSubscription = mutation({
  args: {
    subscriptionId: v.id("pushSubscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// Get VAPID public key for frontend
export const getVapidPublicKey = query({
  args: {},
  handler: async () => {
    return VAPID_PUBLIC_KEY;
  },
});