import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTheme } from "../contexts/ThemeContext";
import { useNotification } from "../contexts/NotificationContext";

export function useUserMenu() {
  const [showNotifications, setShowNotifications] = useState(false);
  const currentUser = useQuery(api.auth.loggedInUser);
  const { theme, toggleTheme } = useTheme();
  const { subscriptionStatus, unreadCount, permission } = useNotification();

  const getNotificationIconType = () => {
    if (permission === "denied" || permission === "unsupported") {
      return "off";
    }
    
    if (subscriptionStatus === "subscribed") {
      return "active";
    }
    
    return "inactive";
  };

  const getNotificationStatus = () => {
    if (permission === "denied") return "Denied";
    if (permission === "unsupported") return "Not Supported";
    if (subscriptionStatus === "subscribed") return "Active";
    return "Inactive";
  };

  return {
    showNotifications,
    setShowNotifications,
    currentUser,
    theme,
    toggleTheme,
    unreadCount,
    permission,
    subscriptionStatus,
    getNotificationIconType,
    getNotificationStatus,
  };
}