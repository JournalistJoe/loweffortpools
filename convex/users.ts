import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db.get(userId);
  },
});

export const makeUserSuperuser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) throw new Error("Must be logged in");
    
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser?.isSuperuser) throw new Error("Must be a superuser to grant superuser privileges");
    
    await ctx.db.patch(args.userId, {
      isSuperuser: true,
    });
    
    return { success: true };
  },
});

export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");
    
    const currentUser = await ctx.db.get(userId);
    if (!currentUser?.isSuperuser) throw new Error("Must be a superuser to view all users");
    
    return await ctx.db
      .query("users")
      .collect();
  },
});