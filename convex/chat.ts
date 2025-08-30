import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

export const getMessages = query({
  args: {
    leagueId: v.id("leagues"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    // Verify user has access to this league
    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    // Check if user is admin, participant, or spectator
    const isAdmin = league.adminUserId === userId;
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();
    
    const spectator = await ctx.db
      .query("spectators")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();

    if (!isAdmin && !participant && !spectator) {
      throw new Error("Access denied - must be league admin, participant, or spectator");
    }

    // Sanitize and clamp the limit to prevent unbounded reads
    const requested = Number(args.limit);
    const defaultLimit = 50;
    const maxLimit = 500;
    const sanitizedLimit = isNaN(requested) 
      ? defaultLimit 
      : Math.floor(Math.max(1, Math.min(requested, maxLimit)));
      
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_league_and_created", (q) =>
        q.eq("leagueId", args.leagueId),
      )
      .order("desc")
      .take(sanitizedLimit);

    // Enrich messages with user data
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        const user = await ctx.db.get(message.userId);
        const userParticipant = await ctx.db
          .query("participants")
          .withIndex("by_league_and_user", (q) =>
            q.eq("leagueId", args.leagueId).eq("userId", message.userId),
          )
          .first();
        
        const userSpectator = await ctx.db
          .query("spectators")
          .withIndex("by_league_and_user", (q) =>
            q.eq("leagueId", args.leagueId).eq("userId", message.userId),
          )
          .first();

        return {
          ...message,
          user: {
            _id: user?._id,
            name: user?.name || "Anonymous",
            // email field removed to prevent PII exposure
          },
          displayName:
            userParticipant?.displayName ||
            userSpectator?.displayName ||
            user?.name ||
            "Anonymous",
          isAdmin: league.adminUserId === message.userId,
          isSpectator: !!userSpectator,
        };
      }),
    );

    // Return in chronological order (oldest first)
    return enrichedMessages.reverse();
  },
});

export const sendMessage = mutation({
  args: {
    leagueId: v.id("leagues"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    // Verify user has access to this league
    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    // Check if user is admin, participant, or spectator
    const isAdmin = league.adminUserId === userId;
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();
    
    const spectator = await ctx.db
      .query("spectators")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();

    if (!isAdmin && !participant && !spectator) {
      throw new Error("Access denied - must be league admin, participant, or spectator");
    }

    // Validate message
    const trimmedMessage = args.message.trim();
    if (!trimmedMessage) {
      throw new Error("Message cannot be empty");
    }

    if (trimmedMessage.length > 500) {
      throw new Error("Message too long (max 500 characters)");
    }

    // Insert message
    const messageId = await ctx.db.insert("chatMessages", {
      leagueId: args.leagueId,
      userId,
      message: trimmedMessage,
      createdAt: Date.now(),
    });

    // Get sender display name for notification
    const senderDisplayName = participant?.displayName || 
                             spectator?.displayName || 
                             (await ctx.db.get(userId))?.name ||
                             "Anonymous";

    // Send push notifications for chat message
    await ctx.scheduler.runAfter(0, api.notificationActions.notifyChatMessage, {
      leagueId: args.leagueId,
      messageId,
      senderUserId: userId,
      message: trimmedMessage,
      senderDisplayName,
    });

    return messageId;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");

    const league = await ctx.db.get(message.leagueId);
    if (!league) throw new Error("League not found");

    // Only allow message author or league admin to delete
    if (message.userId !== userId && league.adminUserId !== userId) {
      throw new Error(
        "Access denied - can only delete your own messages or admin can delete any",
      );
    }

    await ctx.db.delete(args.messageId);
    return true;
  },
});

export const getCombinedFeed = query({
  args: {
    leagueId: v.id("leagues"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    // Verify user has access to this league
    const league = await ctx.db.get(args.leagueId);
    if (!league) throw new Error("League not found");

    // Check if user is admin, participant, or spectator
    const isAdmin = league.adminUserId === userId;
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();
    
    const spectator = await ctx.db
      .query("spectators")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();

    if (!isAdmin && !participant && !spectator) {
      throw new Error("Access denied - must be league admin, participant, or spectator");
    }

    // Sanitize and clamp the limit to prevent unbounded reads
    const requested = Number(args.limit);
    const defaultLimit = 100;
    const maxLimit = 500;
    const sanitizedLimit = isNaN(requested) 
      ? defaultLimit 
      : Math.floor(Math.max(1, Math.min(requested, maxLimit)));
    
    // Fetch chat messages
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_league_and_created", (q) =>
        q.eq("leagueId", args.leagueId),
      )
      .order("desc")
      .take(sanitizedLimit);

    // Fetch activities
    const activities = await ctx.db
      .query("activity")
      .withIndex("by_league_and_created", (q) =>
        q.eq("leagueId", args.leagueId),
      )
      .order("desc")
      .take(sanitizedLimit);

    // Combine and enrich messages
    const enrichedMessages = await Promise.all(
      messages.map(async (message) => {
        const user = await ctx.db.get(message.userId);
        const userParticipant = await ctx.db
          .query("participants")
          .withIndex("by_league_and_user", (q) =>
            q.eq("leagueId", args.leagueId).eq("userId", message.userId),
          )
          .first();
        
        const userSpectator = await ctx.db
          .query("spectators")
          .withIndex("by_league_and_user", (q) =>
            q.eq("leagueId", args.leagueId).eq("userId", message.userId),
          )
          .first();

        return {
          ...message,
          itemType: "message" as const,
          user: {
            _id: user?._id,
            name: user?.name || "Anonymous",
            // email field removed to prevent PII exposure
          },
          displayName:
            userParticipant?.displayName ||
            userSpectator?.displayName ||
            user?.name ||
            "Anonymous",
          isAdmin: league.adminUserId === message.userId,
          isSpectator: !!userSpectator,
          timestamp: message.createdAt,
        };
      }),
    );

    // Format activities as feed items
    const activityItems = activities.map((activity) => ({
      ...activity,
      itemType: "activity" as const,
      timestamp: activity.createdAt,
    }));

    // Combine and sort by timestamp
    const combinedFeed = [...enrichedMessages, ...activityItems]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, sanitizedLimit);

    // Return in chronological order (oldest first)
    return combinedFeed.reverse();
  },
});
