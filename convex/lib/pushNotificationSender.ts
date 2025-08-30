"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import webpush from "web-push";

// VAPID configuration from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noreply@loweffort.bet";

// Configure web-push with VAPID details if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export const sendPushNotificationNode = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    icon: v.optional(v.string()),
    badge: v.optional(v.string()),
    tag: v.optional(v.string()),
    data: v.optional(v.object({
      type: v.string(),
      leagueId: v.optional(v.id("leagues")),
      messageId: v.optional(v.id("chatMessages")),
      activityType: v.optional(v.string()),
      url: v.optional(v.string()),
      timestamp: v.optional(v.number()),
    })),
    actions: v.optional(v.array(v.object({
      action: v.string(),
      title: v.string(),
      icon: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args): Promise<{ sent: number; failed: number; errors: string[]; totalSubscriptions: number }> => {
    try {
      // Check if VAPID keys are configured
      if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.warn('VAPID keys not configured - push notifications will not be sent');
        return { sent: 0, failed: 0, errors: ['VAPID keys not configured'], totalSubscriptions: 0 };
      }
      // Get user's active push subscriptions
      const subscriptions: any[] = await ctx.runQuery(api.pushNotifications.getUserSubscriptionsInternal, {
        userId: args.userId,
      });

      if (subscriptions.length === 0) {
        console.log(`No active push subscriptions for user ${args.userId}`);
        return { sent: 0, failed: 0, errors: [], totalSubscriptions: 0 };
      }

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      // Prepare notification payload
      const payload = JSON.stringify({
        title: args.title,
        body: args.body,
        icon: args.icon || "/icon-192x192.png",
        badge: args.badge || "/icon-192x192.png",
        tag: args.tag,
        data: args.data || {},
        actions: args.actions || [],
        timestamp: Date.now(),
      });

      const options = {
        TTL: 3600, // 1 hour
        urgency: 'normal' as const,
        headers: {},
      };

      // Send to each subscription
      for (const subscription of subscriptions) {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dhKey,
              auth: subscription.authKey,
            },
          };

          await webpush.sendNotification(pushSubscription, payload, options);
          sent++;
          
          console.log(`Push notification sent successfully to subscription ${subscription._id}`);
          
          // Log successful delivery
          await ctx.runMutation(api.pushNotifications.logNotificationDelivery, {
            userId: args.userId,
            subscriptionId: subscription._id,
            title: args.title,
            body: args.body,
            type: args.data?.type || "notification",
            status: "sent",
            leagueId: args.data?.leagueId,
          });
          
        } catch (error) {
          failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Subscription ${subscription._id}: ${errorMessage}`);
          
          console.error(`Failed to send push notification to subscription ${subscription._id}:`, error);
          
          // Log failed delivery
          try {
            await ctx.runMutation(api.pushNotifications.logNotificationDelivery, {
              userId: args.userId,
              subscriptionId: subscription._id,
              title: args.title,
              body: args.body,
              type: args.data?.type || "notification",
              status: "failed",
              errorMessage: errorMessage,
              leagueId: args.data?.leagueId,
            });
          } catch (logError) {
            console.error('Failed to log delivery error:', logError);
          }
          
          // Check if subscription is invalid and should be deactivated
          if (error instanceof Error) {
            const statusCode = (error as any).statusCode;
            const isInvalid = statusCode === 410 || // Gone
                            statusCode === 404 || // Not Found  
                            statusCode === 413 || // Payload too large
                            errorMessage.includes("invalid") ||
                            errorMessage.includes("expired") ||
                            errorMessage.includes("unsubscribed");
                            
            if (isInvalid) {
              try {
                await ctx.runMutation(api.pushNotifications.deactivateSubscription, {
                  subscriptionId: subscription._id,
                });
                console.log(`Deactivated invalid subscription ${subscription._id}`);
              } catch (deactivateError) {
                console.error(`Failed to deactivate subscription ${subscription._id}:`, deactivateError);
              }
            }
          }
        }
      }

      console.log(`Push notification batch completed: ${sent} sent, ${failed} failed for user ${args.userId}`);
      
      return { 
        sent, 
        failed, 
        errors,
        totalSubscriptions: subscriptions.length 
      };
      
    } catch (error) {
      console.error('Push notification sender error:', error);
      throw new Error(`Push notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});