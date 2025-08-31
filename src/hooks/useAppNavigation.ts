import { useParams, useLocation } from "react-router-dom";
import { 
  Users, 
  Trophy, 
  Calendar, 
  Settings, 
  User 
} from "lucide-react";

interface League {
  _id: string;
  name?: string;
  status: string;
  isAdmin: boolean;
  isParticipant: boolean;
  isSpectator?: boolean;
  scheduledDraftDate?: number;
  participant?: {
    _id: string;
    displayName: string;
  };
  spectator?: {
    _id: string;
    displayName: string;
  };
}

export function useAppNavigation(league: League) {
  const { leagueId } = useParams<{ leagueId: string }>();
  const location = useLocation();

  const getLeagueNavItems = () => {
    const items = [];

    // Show different tabs based on league status
    if (league.status === "setup") {
      // Setup phase - show draft tab first, then participants tab
      items.push({
        name: "Draft",
        href: `/league/${leagueId}/draft`,
        current: location.pathname.includes("/draft"),
        icon: Trophy,
      });
      items.push({
        name: "Participants",
        href: `/league/${leagueId}/participants`,
        current: location.pathname.includes("/participants"),
        icon: Users,
      });
    } else if (league.status === "draft") {
      items.unshift({
        name: "Draft",
        href: `/league/${leagueId}/draft`,
        current: location.pathname.includes("/draft"),
        icon: Trophy,
      });
    } else if (league.status === "live" || league.status === "completed") {
      items.unshift({
        name: "Leaderboard",
        href: `/league/${leagueId}/leaderboard`,
        current: location.pathname.includes("/leaderboard"),
        icon: Trophy,
      });
      items.push({
        name: "Schedule",
        href: `/league/${leagueId}/schedule`,
        current: location.pathname.includes("/schedule"),
        icon: Calendar,
      });
    }

    // My Team tab (only available for participants)
    if (league.isParticipant && league.participant) {
      items.push({
        name: "My Team",
        href: `/league/${leagueId}/team/${league.participant._id}`,
        current: location.pathname.includes("/team/"),
        icon: User,
      });
    }

    // Admin tab (always last if user is admin)
    if (league.isAdmin) {
      items.push({
        name: "Admin",
        href: `/league/${leagueId}/admin`,
        current: location.pathname.includes("/admin"),
        icon: Settings,
      });
    }

    return items;
  };

  const getBottomNavItems = () => {
    const navItems = getLeagueNavItems();
    
    // Filter out chat route (if it exists) and return items as-is
    // Keep "My Team" static to prevent text overlap in mobile footer
    return navItems.filter(item => 
      !item.href.includes('/chat')
    );
  };

  return {
    leagueNavItems: getLeagueNavItems(),
    bottomNavItems: getBottomNavItems(),
  };
}