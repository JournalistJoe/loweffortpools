import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface NotificationContextType {
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  subscriptionStatus: "checking" | "subscribed" | "unsubscribed" | "error";
  unreadCount: number;
  requestPermission: () => Promise<boolean>;
  clearBadge: () => void;
  updateBadge: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscriptionStatus, setSubscriptionStatus] = useState<"checking" | "subscribed" | "unsubscribed" | "error">("checking");
  const [unreadCount, setUnreadCount] = useState(0);

  const userSubscriptions = useQuery(api.pushNotifications.getUserSubscriptions);

  // Check notification support and permission on mount
  useEffect(() => {
    checkSupport();
  }, []);

  // Update subscription status based on user subscriptions
  useEffect(() => {
    if (userSubscriptions) {
      const hasActiveSubscriptions = userSubscriptions.some(sub => sub.isActive);
      setSubscriptionStatus(hasActiveSubscriptions ? "subscribed" : "unsubscribed");
    }
  }, [userSubscriptions]);

  const checkSupport = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setIsSupported(false);
      setPermission("unsupported");
      setSubscriptionStatus("error");
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    try {
      // Check if we have an existing service worker subscription
      if (Notification.permission === "granted") {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setSubscriptionStatus(subscription ? "subscribed" : "unsubscribed");
      } else {
        setSubscriptionStatus("unsubscribed");
      }
    } catch (error) {
      console.error("Error checking notification support:", error);
      setSubscriptionStatus("error");
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);

      // Track permission request with Plausible
      if (typeof window !== 'undefined' && 'plausible' in window) {
        (window as any).plausible('NotificationPermission', {
          props: { 
            action: permission,
            timestamp: Date.now()
          }
        });
      }

      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      setPermission("denied");
      return false;
    }
  };

  const clearBadge = useCallback(() => {
    setUnreadCount(0);
    updateAppBadge(0);

    // Send message to service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_BADGE'
      });
    }
  }, []);

  const updateBadge = useCallback((count: number) => {
    setUnreadCount(count);
    updateAppBadge(count);

    // Send message to service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_BADGE',
        count
      });
    }
  }, []);

  const updateAppBadge = (count: number) => {
    try {
      if ('setAppBadge' in navigator) {
        if (count > 0) {
          (navigator as any).setAppBadge(count);
        } else {
          (navigator as any).clearAppBadge();
        }
      }
    } catch (error) {
      // Silently fail if badge API is not supported
      console.debug("App badge API not supported:", error);
    }
  };

  // Listen for visibility changes to clear badge when app becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearBadge();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearBadge]);

  // Listen for focus events to clear badge
  useEffect(() => {
    const handleFocus = () => {
      clearBadge();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [clearBadge]);

  const contextValue: NotificationContextType = {
    isSupported,
    permission,
    subscriptionStatus,
    unreadCount,
    requestPermission,
    clearBadge,
    updateBadge,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}