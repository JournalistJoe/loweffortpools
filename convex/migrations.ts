import { v } from "convex/values";
import { internalMutation, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function to avoid circular references
async function cleanupDuplicatesLogic(ctx: MutationCtx, dryRun: boolean) {
  // Get all draft preferences
  const allPreferences = await ctx.db.query("draftPreferences").collect();
  
  // Group by (leagueId, participantId)
  const groupedPreferences = new Map<string, typeof allPreferences>();
  
  for (const preference of allPreferences) {
    const key = `${preference.leagueId}:${preference.participantId}`;
    if (!groupedPreferences.has(key)) {
      groupedPreferences.set(key, []);
    }
    groupedPreferences.get(key)!.push(preference);
  }
  
  // Find duplicates and prepare cleanup
  const duplicatesFound: Array<{
    leagueId: string;
    participantId: string;
    duplicateCount: number;
    kept: string;
    removed: string[];
  }> = [];
  
  let totalRemoved = 0;
  
  for (const [, preferences] of groupedPreferences) {
    if (preferences.length > 1) {
      // Sort by updatedAt (most recent first)
      preferences.sort((a, b) => b.updatedAt - a.updatedAt);
      
      // Keep the most recent one
      const toKeep = preferences[0];
      const toRemove = preferences.slice(1);
      
      duplicatesFound.push({
        leagueId: toKeep.leagueId,
        participantId: toKeep.participantId,
        duplicateCount: preferences.length,
        kept: toKeep._id,
        removed: toRemove.map(p => p._id),
      });
      
      if (!dryRun) {
        // Actually delete the duplicates
        for (const preference of toRemove) {
          await ctx.db.delete(preference._id);
          totalRemoved++;
        }
      } else {
        totalRemoved += toRemove.length;
      }
    }
  }
  
  return {
    duplicatesFound: duplicatesFound.length,
    totalPreferencesRemoved: totalRemoved,
    details: duplicatesFound,
    dryRun,
  };
}

export const cleanupDuplicateDraftPreferences = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()), // If true, just return what would be cleaned up
  },
  handler: async (ctx, args) => {
    return await cleanupDuplicatesLogic(ctx, args.dryRun || false);
  },
});

// Utility mutation to check for duplicates without cleaning them up
export const checkForDuplicateDraftPreferences = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await cleanupDuplicatesLogic(ctx, true);
  },
});

// Mutation that can be called by admin users to clean up duplicates
export const adminCleanupDuplicates = internalMutation({
  args: {
    adminUserId: v.id("users"),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Verify admin user exists and is superuser
    const adminUser = await ctx.db.get(args.adminUserId);
    if (!adminUser || !adminUser.isSuperuser) {
      throw new Error("Only superusers can run this migration");
    }
    
    return await cleanupDuplicatesLogic(ctx, args.dryRun || false);
  },
});