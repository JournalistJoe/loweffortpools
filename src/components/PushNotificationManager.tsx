import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Bell, BellOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function PushNotificationManager() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "checking" | "supported" | "unsupported" | "denied" | "subscribed" | "unsubscribed"
  >("checking");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const vapidPublicKey = useQuery(api.pushNotifications.getVapidPublicKey);
  const subscribe = useMutation(api.pushNotifications.subscribe);
  const unsubscribe = useMutation(api.pushNotifications.unsubscribe);
  const userSubscriptions = useQuery(api.pushNotifications.getUserSubscriptions);

  // Check push notification support and permission status
  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const checkNotificationSupport = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSubscriptionStatus("unsupported");
      return;
    }

    try {
      // Only read permission status, don't request yet
      const permission = Notification.permission;
      if (permission === "denied") {
        setSubscriptionStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        // Verify subscription is persisted server-side
        try {
          if (userSubscriptions && userSubscriptions.some(sub => 
            sub.endpoint === existingSubscription.endpoint && sub.isActive
          )) {
            setSubscription(existingSubscription);
            setSubscriptionStatus("subscribed");
          } else {
            // Subscription not found server-side, treat as unsubscribed
            setSubscriptionStatus("unsubscribed");
          }
        } catch (error) {
          console.error("Error verifying subscription server-side:", error);
          setSubscription(existingSubscription);
          setSubscriptionStatus("subscribed"); // Assume it's valid
        }
      } else {
        if (permission === "granted") {
          setSubscriptionStatus("unsubscribed");
        } else {
          setSubscriptionStatus("supported");
        }
      }
    } catch (error) {
      console.error("Error checking notification support:", error);
      setSubscriptionStatus("unsupported");
    }
  };

  const handleSubscribe = async () => {
    if (!vapidPublicKey) {
      toast.error("VAPID key not available");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setSubscriptionStatus("denied");
        toast.error("Notification permission denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription first
      let newSubscription = await registration.pushManager.getSubscription();
      
      if (!newSubscription) {
        // Only subscribe if no existing subscription
        newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      // Extract subscription details with null checks
      const p256dhKey = newSubscription.getKey("p256dh");
      const authKey = newSubscription.getKey("auth");
      
      if (!p256dhKey || !authKey) {
        console.error("Failed to get subscription keys - p256dhKey or authKey is null");
        toast.error("Failed to setup push notifications - invalid subscription keys");
        return;
      }
      
      const p256dh = arrayBufferToBase64(p256dhKey);
      const auth = arrayBufferToBase64(authKey);

      // Save subscription to backend
      await subscribe({
        endpoint: newSubscription.endpoint,
        p256dhKey: p256dh,
        authKey: auth,
        userAgent: navigator.userAgent,
      });

      setSubscription(newSubscription);
      setSubscriptionStatus("subscribed");
      toast.success("Push notifications enabled!");

      // Track successful subscription
      if (typeof window !== 'undefined' && 'plausible' in window) {
        (window as any).plausible('NotificationSubscribed', {
          props: { 
            userAgent: navigator.userAgent,
            timestamp: Date.now()
          }
        });
      }

    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      toast.error("Failed to enable push notifications");
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      await unsubscribe({ endpoint: subscription.endpoint });

      setSubscription(null);
      setSubscriptionStatus("unsubscribed");
      toast.success("Push notifications disabled");

      // Track unsubscription
      if (typeof window !== 'undefined' && 'plausible' in window) {
        (window as any).plausible('NotificationUnsubscribed', {
          props: { 
            timestamp: Date.now()
          }
        });
      }

    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      toast.error("Failed to disable push notifications");
    }
  };

  // Helper functions
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return window.btoa(binary);
  };

  const renderStatus = () => {
    switch (subscriptionStatus) {
      case "checking":
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Checking...
          </Badge>
        );

      case "unsupported":
        return (
          <Badge variant="destructive">
            <BellOff className="w-3 h-3 mr-1" />
            Not Supported
          </Badge>
        );

      case "denied":
        return (
          <Badge variant="destructive">
            <BellOff className="w-3 h-3 mr-1" />
            Permission Denied
          </Badge>
        );

      case "subscribed":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );

      case "unsubscribed":
        return (
          <Badge variant="outline">
            <Bell className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        );

      default:
        return null;
    }
  };

  const renderContent = () => {
    if (subscriptionStatus === "unsupported") {
      return (
        <div className="text-center text-muted-foreground">
          <BellOff className="w-12 h-12 mx-auto mb-4" />
          <p>Push notifications are not supported in your browser.</p>
          <p className="text-sm mt-2">
            Try using Chrome, Firefox, or Edge for the best experience.
          </p>
        </div>
      );
    }

    if (subscriptionStatus === "denied") {
      return (
        <div className="text-center text-muted-foreground">
          <BellOff className="w-12 h-12 mx-auto mb-4" />
          <p>Push notification permission has been denied.</p>
          <p className="text-sm mt-2">
            To enable notifications, please allow them in your browser settings and refresh the page.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          {subscriptionStatus === "subscribed" ? (
            <div>
              <p className="font-medium text-green-600 mb-2">
                Push notifications are active!
              </p>
              <p className="text-sm text-muted-foreground">
                You'll receive notifications for draft picks, your turn, and chat messages.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-medium mb-2">Enable Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Get notified about draft picks, your turn, and important league updates even when the app is closed.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          {subscriptionStatus === "subscribed" ? (
            <Button variant="outline" onClick={handleUnsubscribe}>
              <BellOff className="w-4 h-4 mr-2" />
              Disable Notifications
            </Button>
          ) : (
            <Button onClick={handleSubscribe} disabled={subscriptionStatus === "checking"}>
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>
          )}
        </div>

        {userSubscriptions && userSubscriptions.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Active on {userSubscriptions.length} device{userSubscriptions.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {userSubscriptions.map((sub) => (
                <div key={sub._id} className="text-xs bg-muted p-2 rounded">
                  <p className="font-mono truncate">
                    {sub.userAgent || "Unknown device"}
                  </p>
                  <p className="text-muted-foreground">
                    Added {new Date(sub.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Push Notifications
            </CardTitle>
            <CardDescription>
              Get notified about league activity and your draft turns
            </CardDescription>
          </div>
          {renderStatus()}
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}