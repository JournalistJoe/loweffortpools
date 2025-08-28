import { Link, useParams } from "react-router-dom";
import { SignOutButton } from "../SignOutButton";
import { useState } from "react";

interface NavigationProps {
  league: {
    _id: string;
    name?: string;
    status: string;
    isAdmin: boolean;
    isParticipant: boolean;
  };
}

export function MobileNavigation({ league }: NavigationProps) {
  const { leagueId } = useParams<{ leagueId: string }>();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavItems = () => {
    const items = [];

    items.push({
      name: "Participants",
      href: `/league/${leagueId}/participants`,
      current: location.pathname.includes("/participants"),
      icon: "👥",
    });

    if (league.status === "draft") {
      items.unshift({
        name: "Draft",
        href: `/league/${leagueId}/draft`,
        current: location.pathname.includes("/draft"),
        icon: "🏈",
      });
    } else if (league.status === "live" || league.status === "completed") {
      items.unshift({
        name: "Leaderboard",
        href: `/league/${leagueId}/leaderboard`,
        current: location.pathname.includes("/leaderboard"),
        icon: "🏆",
      });
      items.push({
        name: "Schedule",
        href: `/league/${leagueId}/schedule`,
        current: location.pathname.includes("/schedule"),
        icon: "📅",
      });
    }

    if (league.isParticipant || league.isAdmin) {
      items.push({
        name: "Chat",
        href: `/league/${leagueId}/chat`,
        current: location.pathname.includes("/chat"),
        icon: "💬",
      });
    }

    if (league.isAdmin) {
      items.push({
        name: "Admin",
        href: `/league/${leagueId}/admin`,
        current: location.pathname.includes("/admin"),
        icon: "⚙️",
      });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <div>
      <nav className="bg-white shadow md:block hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link
                to="/"
                className="text-xl font-bold text-gray-900 hover:text-gray-700"
              >
                NFL Pool
              </Link>

              <div className="flex items-center space-x-1">
                <span className="text-gray-500">›</span>
                <span className="text-gray-900 font-medium">
                  {league.name || "Unnamed League"}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              <SignOutButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden">
        <div className="bg-white shadow">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <Link to="/" className="text-xl font-bold text-gray-900 block">
                NFL Pool
              </Link>
              <div className="text-sm text-gray-600 truncate mt-0.5">
                {league.name || "Unnamed League"}
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="ml-4 p-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 min-h-[48px] min-w-[48px] flex items-center justify-center"
            >
              Menu
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="bg-white shadow-lg border-t border-gray-100">
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-4 rounded-xl text-base font-medium transition-colors min-h-[56px] ${
                    item.current
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="mr-4 text-xl">{item.icon}</span>
                  {item.name}
                </Link>
              ))}

              <div className="pt-2 border-t border-gray-200">
                <SignOutButton />
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
          <div className="flex justify-around items-center">
            {navItems.slice(0, 4).map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center px-2 py-1 rounded-lg transition-colors min-h-[44px] min-w-[44px] justify-center ${
                  item.current
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="text-lg mb-1">{item.icon}</span>
                <span className="text-xs font-medium truncate max-w-[50px]">
                  {item.name}
                </span>
              </Link>
            ))}

            {navItems.length > 4 && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex flex-col items-center px-2 py-1 rounded-lg text-gray-500 hover:text-gray-700 transition-colors min-h-[44px] min-w-[44px] justify-center"
              >
                <span className="text-lg mb-1">⋯</span>
                <span className="text-xs font-medium">More</span>
              </button>
            )}
          </div>
        </div>

        <div className="h-20"></div>
      </div>
    </div>
  );
}
