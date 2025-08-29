import { Link, useParams } from "react-router-dom";
import { SignOutButtonShadCN } from "../SignOutButtonShadCN";

interface NavigationProps {
  league: {
    _id: string;
    name?: string;
    status: string;
    isAdmin: boolean;
    isParticipant: boolean;
  };
}

export function Navigation({ league }: NavigationProps) {
  const { leagueId } = useParams<{ leagueId: string }>();

  const getNavItems = () => {
    const items = [];

    // Always show participants
    items.push({
      name: "Participants",
      href: `/league/${leagueId}/participants`,
      current: location.pathname.includes("/participants"),
    });

    // Show different tabs based on league status
    if (league.status === "setup") {
      // Setup phase - no additional tabs
    } else if (league.status === "draft") {
      items.unshift({
        name: "Draft",
        href: `/league/${leagueId}/draft`,
        current: location.pathname.includes("/draft"),
      });
    } else if (league.status === "live" || league.status === "completed") {
      items.unshift({
        name: "Leaderboard",
        href: `/league/${leagueId}/leaderboard`,
        current: location.pathname.includes("/leaderboard"),
      });
      items.push({
        name: "Schedule",
        href: `/league/${leagueId}/schedule`,
        current: location.pathname.includes("/schedule"),
      });
    }

    // Admin tab (always last if user is admin)
    if (league.isAdmin) {
      items.push({
        name: "Admin",
        href: `/league/${leagueId}/admin`,
        current: location.pathname.includes("/admin"),
      });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              to="/"
              className="text-xl font-bold text-foreground hover:text-muted-foreground"
            >
              {league.name || "Unnamed League"}
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.current
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.name}
              </Link>
            ))}

            <SignOutButtonShadCN />
          </div>
        </div>
      </div>
    </nav>
  );
}
