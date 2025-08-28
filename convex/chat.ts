import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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

    // Check if user is admin or participant
    const isAdmin = league.adminUserId === userId;
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();

    if (!isAdmin && !participant) {
      throw new Error("Access denied - must be league admin or participant");
    }

    const limit = args.limit || 50;
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_league_and_created", (q) =>
        q.eq("leagueId", args.leagueId),
      )
      .order("desc")
      .take(limit);

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

        return {
          ...message,
          user: {
            _id: user?._id,
            name: user?.name || user?.email || "Anonymous",
            email: user?.email,
          },
          displayName:
            userParticipant?.displayName ||
            user?.name ||
            user?.email ||
            "Anonymous",
          isAdmin: league.adminUserId === message.userId,
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

    // Check if user is admin or participant
    const isAdmin = league.adminUserId === userId;
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_league_and_user", (q) =>
        q.eq("leagueId", args.leagueId).eq("userId", userId),
      )
      .first();

    if (!isAdmin && !participant) {
      throw new Error("Access denied - must be league admin or participant");
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
