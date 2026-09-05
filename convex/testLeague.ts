import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { JOIN_CODE_LENGTH } from "./constants";
import { CURRENT_SEASON_YEAR } from "./lib/nflSeason";

// Generate a random join code (copied from leagues.ts)
function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Snake draft order calculation helper
function getParticipantForPick(pickIndex: number): number {
  const round = Math.floor(pickIndex / 8) + 1;
  const positionInRound = pickIndex % 8;

  if (round % 2 === 1) {
    // Odd rounds: 1, 2, 3, 4, 5, 6, 7, 8
    return positionInRound + 1;
  } else {
    // Even rounds: 8, 7, 6, 5, 4, 3, 2, 1
    return 8 - positionInRound;
  }
}

export const createTestLeague = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be logged in");

    const seasonYear = CURRENT_SEASON_YEAR;
    const timestamp = Date.now();

    // Generate unique join code
    let joinCode: string;
    let attempts = 0;
    do {
      joinCode = generateJoinCode();
      const existing = await ctx.db
        .query("leagues")
        .withIndex("by_join_code", (q) => q.eq("joinCode", joinCode))
        .first();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    if (attempts >= 10) {
      throw new Error("Failed to generate unique join code");
    }

    // Create the test league
    const leagueId = await ctx.db.insert("leagues", {
      name: `Test League ${new Date(timestamp).toLocaleString()}`,
      status: "live",
      adminUserId: userId,
      seasonYear,
      joinCode,
    });

    // Ensure NFL teams exist for this season
    const existingTeams = await ctx.db
      .query("nflTeams")
      .withIndex("by_season", (q) => q.eq("seasonYear", seasonYear))
      .collect();

    const nflTeams = existingTeams;
    if (nflTeams.length < 32) {
      throw new Error(
        `Found ${nflTeams.length} of 32 NFL teams for ${seasonYear}. Import teams first from System Admin.`,
      );
    }

    // Create 8 test participants with realistic team names
    const testParticipants = [
      { name: "Mike's Maulers", position: 1 },
      { name: "Sarah's Squad", position: 2 },
      { name: "The Grid Warriors", position: 3 },
      { name: "Dynasty Dreams", position: 4 },
      { name: "Fantasy Kings", position: 5 },
      { name: "Touchdown Town", position: 6 },
      { name: "End Zone Elite", position: 7 },
      { name: "Championship Chasers", position: 8 },
    ];

    const participantIds = [];
    for (const testParticipant of testParticipants) {
      const participantId = await ctx.db.insert("participants", {
        leagueId,
        userId, // Using admin user for all participants for testing
        displayName: testParticipant.name,
        draftPosition: testParticipant.position,
      });
      participantIds.push(participantId);

      await ctx.db.insert("activity", {
        leagueId,
        type: "participant_added",
        message: `${testParticipant.name} joined the league (Draft Position ${testParticipant.position})`,
        createdAt: timestamp - (8 - testParticipant.position) * 30000, // Stagger join times
        participantId,
      });
    }

    // Simulate complete draft with snake order
    const shuffledTeams = [...nflTeams].sort(() => Math.random() - 0.5);

    for (let pickIndex = 0; pickIndex < 32; pickIndex++) {
      const draftPosition = getParticipantForPick(pickIndex);
      const participant = participantIds[draftPosition - 1];
      const nflTeam = shuffledTeams[pickIndex];
      const round = Math.floor(pickIndex / 8) + 1;
      const pickNumber = pickIndex + 1;
      const pickTime = timestamp + 60000 + pickIndex * 90000; // Draft started 1 min after creation, 1.5 min per pick

      await ctx.db.insert("draftPicks", {
        leagueId,
        round,
        pickNumber,
        participantId: participant,
        nflTeamId: nflTeam._id,
        pickedAt: pickTime,
      });

      await ctx.db.insert("activity", {
        leagueId,
        type: "draft_pick",
        message: `${testParticipants[draftPosition - 1].name} selected ${nflTeam.fullName}`,
        createdAt: pickTime,
        participantId: participant,
        nflTeamId: nflTeam._id,
      });
    }

    // Add league creation and draft completion activities
    await ctx.db.insert("activity", {
      leagueId,
      type: "league_created",
      message: `Test league created with 8 participants`,
      createdAt: timestamp,
    });

    await ctx.db.insert("activity", {
      leagueId,
      type: "draft_started",
      message: "Draft has started!",
      createdAt: timestamp + 60000,
    });

    await ctx.db.insert("activity", {
      leagueId,
      type: "draft_completed",
      message: "Draft completed! League is now live.",
      createdAt: timestamp + 60000 + 31 * 90000, // After last pick
    });

    return { leagueId, message: "Test league created with complete draft!" };
  },
});
