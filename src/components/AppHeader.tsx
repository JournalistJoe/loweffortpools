import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { Separator } from "./ui/separator";
import { UserMenu } from "./UserMenu";

interface AppHeaderProps {
  breadcrumb?: string;
  actions?: ReactNode;
  showUserMenu?: boolean;
}

export function AppHeader({ breadcrumb, actions, showUserMenu = true }: AppHeaderProps) {
  const { theme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Main header row */}
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link
            to="/"
            className="flex items-center space-x-2 text-foreground hover:text-muted-foreground transition-colors"
          >
            <img
              src={theme === "dark" ? "/lowEffortLogo-darkmode.png" : "/lowEffortLogo.png"}
              alt="LowEffort.bet Logo"
              className="h-8 w-8"
            />
            <span className="text-xl font-bold">LowEffort.bet</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-2">
          {actions}
          {showUserMenu && <UserMenu />}
        </div>
      </div>
      
      {/* League name row */}
      {breadcrumb && (
        <div className="container border-t bg-background/80 backdrop-blur">
          <div className="py-3 px-4">
            <h2 className="text-lg font-semibold text-foreground">{breadcrumb}</h2>
          </div>
        </div>
      )}
    </header>
  );
}