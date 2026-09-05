import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import {
  CURRENT_SEASON_YEAR,
  getCurrentNFLWeek,
  isRegularSeasonComplete,
} from "./lib/nflSeason";

const crons = cronJobs();

// Nightly sync at 03:00 PT (11:00 UTC)
crons.cron("nightly sync", "0 11 * * *", internal.crons.nightlySync, {});

// Weekly finalize at Tuesday 03:15 PT (11:15 UTC)
crons.cron("weekly finalize", "15 11 * * 2", internal.crons.weeklyFinalize, {});

// Check for expired draft picks every minute as backup (can't do 30 seconds with standard cron)
crons.cron("draft autopick", "* * * * *", internal.draft.checkAndMakeAutoPick, {});

export default crons;

export const nightlySync = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const seasonYear = CURRENT_SEASON_YEAR;
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
    return null;
  },
});

export const weeklyFinalize = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const seasonYear = CURRENT_SEASON_YEAR;
    // getCurrentNFLWeek clamps at 18, so once the season is over the week to
    // finalize is 18 itself; otherwise it is the week that just ended.
    const previousWeek = isRegularSeasonComplete() ? 18 : getCurrentNFLWeek() - 1;

    let syncSucceeded = previousWeek < 1;
    if (previousWeek >= 1) {
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
        syncSucceeded = true;
      } catch (error) {
        await ctx.runMutation(internal.crons.recordSyncRun, {
          type: "weekly",
          summary: `Weekly finalize failed for week ${previousWeek}`,
          week: previousWeek,
          success: false,
          error: String(error),
        });
      }
    }

    // Only close out the season once the final week's results are safely synced.
    if (syncSucceeded && isRegularSeasonComplete()) {
      await ctx.runMutation(internal.leagues.completeLiveLeaguesForSeason, {
        seasonYear,
      });
    }

    return null;
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
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("syncRuns", {
      ranAt: Date.now(),
      type: args.type,
      summary: args.summary,
      week: args.week,
      success: args.success,
      error: args.error,
    });
    return null;
  },
});
