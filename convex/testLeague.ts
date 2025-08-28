import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Generate a random 6-character join code (copied from leagues.ts)
function generateJoinCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
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

    const seasonYear = 2025;
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

    let nflTeams = existingTeams;
    if (existingTeams.length === 0) {
      // Import NFL teams if they don't exist
      const NFL_TEAMS_2025 = [
        {
          espnId: 1,
          abbrev: "ATL",
          name: "Falcons",
          fullName: "Atlanta Falcons",
        },
        { espnId: 2, abbrev: "BUF", name: "Bills", fullName: "Buffalo Bills" },
        { espnId: 3, abbrev: "CHI", name: "Bears", fullName: "Chicago Bears" },
        {
          espnId: 4,
          abbrev: "CIN",
          name: "Bengals",
          fullName: "Cincinnati Bengals",
        },
        {
          espnId: 5,
          abbrev: "CLE",
          name: "Browns",
          fullName: "Cleveland Browns",
        },
        {
          espnId: 6,
          abbrev: "DAL",
          name: "Cowboys",
          fullName: "Dallas Cowboys",
        },
        {
          espnId: 7,
          abbrev: "DEN",
          name: "Broncos",
          fullName: "Denver Broncos",
        },
        { espnId: 8, abbrev: "DET", name: "Lions", fullName: "Detroit Lions" },
        {
          espnId: 9,
          abbrev: "GB",
          name: "Packers",
          fullName: "Green Bay Packers",
        },
        {
          espnId: 10,
          abbrev: "TEN",
          name: "Titans",
          fullName: "Tennessee Titans",
        },
        {
          espnId: 11,
          abbrev: "IND",
          name: "Colts",
          fullName: "Indianapolis Colts",
        },
        {
          espnId: 12,
          abbrev: "KC",
          name: "Chiefs",
          fullName: "Kansas City Chiefs",
        },
        {
          espnId: 13,
          abbrev: "LV",
          name: "Raiders",
          fullName: "Las Vegas Raiders",
        },
        {
          espnId: 14,
          abbrev: "LAR",
          name: "Rams",
          fullName: "Los Angeles Rams",
        },
        {
          espnId: 15,
          abbrev: "MIA",
          name: "Dolphins",
          fullName: "Miami Dolphins",
        },
        {
          espnId: 16,
          abbrev: "MIN",
          name: "Vikings",
          fullName: "Minnesota Vikings",
        },
        {
          espnId: 17,
          abbrev: "NE",
          name: "Patriots",
          fullName: "New England Patriots",
        },
        {
          espnId: 18,
          abbrev: "NO",
          name: "Saints",
          fullName: "New Orleans Saints",
        },
        {
          espnId: 19,
          abbrev: "NYG",
          name: "Giants",
          fullName: "New York Giants",
        },
        { espnId: 20, abbrev: "NYJ", name: "Jets", fullName: "New York Jets" },
        {
          espnId: 21,
          abbrev: "PHI",
          name: "Eagles",
          fullName: "Philadelphia Eagles",
        },
        {
          espnId: 22,
          abbrev: "ARI",
          name: "Cardinals",
          fullName: "Arizona Cardinals",
        },
        {
          espnId: 23,
          abbrev: "PIT",
          name: "Steelers",
          fullName: "Pittsburgh Steelers",
        },
        {
          espnId: 24,
          abbrev: "LAC",
          name: "Chargers",
          fullName: "Los Angeles Chargers",
        },
        {
          espnId: 25,
          abbrev: "SF",
          name: "49ers",
          fullName: "San Francisco 49ers",
        },
        {
          espnId: 26,
          abbrev: "SEA",
          name: "Seahawks",
          fullName: "Seattle Seahawks",
        },
        {
          espnId: 27,
          abbrev: "TB",
          name: "Buccaneers",
          fullName: "Tampa Bay Buccaneers",
        },
        {
          espnId: 28,
          abbrev: "WAS",
          name: "Commanders",
          fullName: "Washington Commanders",
        },
        {
          espnId: 29,
          abbrev: "CAR",
          name: "Panthers",
          fullName: "Carolina Panthers",
        },
        {
          espnId: 30,
          abbrev: "JAX",
          name: "Jaguars",
          fullName: "Jacksonville Jaguars",
        },
        {
          espnId: 33,
          abbrev: "BAL",
          name: "Ravens",
          fullName: "Baltimore Ravens",
        },
        {
          espnId: 34,
          abbrev: "HOU",
          name: "Texans",
          fullName: "Houston Texans",
        },
      ];

      const teamIds = [];
      for (const teamData of NFL_TEAMS_2025) {
        const teamId = await ctx.db.insert("nflTeams", {
          ...teamData,
          seasonYear,
        });
        teamIds.push(teamId);
      }

      // Refetch the teams after inserting
      nflTeams = await ctx.db
        .query("nflTeams")
        .withIndex("by_season", (q) => q.eq("seasonYear", seasonYear))
        .collect();
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
