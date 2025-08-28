import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";

const crons = cronJobs();

// Nightly sync at 03:00 PT (11:00 UTC)
crons.cron("nightly sync", "0 11 * * *", internal.crons.nightlySync, {});

// Weekly finalize at Tuesday 03:15 PT (11:15 UTC)
crons.cron("weekly finalize", "15 11 * * 2", internal.crons.weeklyFinalize, {});

export default crons;

export const nightlySync = internalAction({
  args: {},
  handler: async (ctx) => {
    const seasonYear = 2025;
    const currentWeek = getCurrentNFLWeek();

    try {
      await ctx.runAction(internal.nflData.syncGamesFromESPN, {
        week: currentWeek,
        seasonYear,
      });

      await ctx.runMutation(internal.crons.recordSyncRun, {
        type: "nightly",
        summary: `Nightly sync completed for week ${currentWeek}`,
        week: currentWeek,
        success: true,
      });
    } catch (error) {
      await ctx.runMutation(internal.crons.recordSyncRun, {
        type: "nightly",
        summary: `Nightly sync failed for week ${currentWeek}`,
        week: currentWeek,
        success: false,
        error: String(error),
      });
    }
  },
});

export const weeklyFinalize = internalAction({
  args: {},
  handler: async (ctx) => {
    const seasonYear = 2025;
    const previousWeek = getCurrentNFLWeek() - 1;

    if (previousWeek < 1) return; // No previous week to finalize

    try {
      await ctx.runAction(internal.nflData.syncGamesFromESPN, {
        week: previousWeek,
        seasonYear,
      });

      await ctx.runMutation(internal.crons.recordSyncRun, {
        type: "weekly",
        summary: `Weekly finalize completed for week ${previousWeek}`,
        week: previousWeek,
        success: true,
      });
    } catch (error) {
      await ctx.runMutation(internal.crons.recordSyncRun, {
        type: "weekly",
        summary: `Weekly finalize failed for week ${previousWeek}`,
        week: previousWeek,
        success: false,
        error: String(error),
      });
    }
  },
});

export const recordSyncRun = internalMutation({
  args: {
    type: v.union(
      v.literal("nightly"),
      v.literal("weekly"),
      v.literal("manual"),
    ),
    summary: v.string(),
    week: v.optional(v.number()),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("syncRuns", {
      ranAt: Date.now(),
      type: args.type,
      summary: args.summary,
      week: args.week,
      success: args.success,
      error: args.error,
    });
  },
});

// Helper function to determine current NFL week
function getCurrentNFLWeek(): number {
  // NFL 2025 season starts approximately in September
  // This is a simplified calculation - in production you'd want more precise logic
  const now = new Date();
  const seasonStart = new Date(2025, 8, 5); // September 5, 2025 (approximate)
  const weeksSinceStart = Math.floor(
    (now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000),
  );

  return Math.max(1, Math.min(18, weeksSinceStart + 1));
}
