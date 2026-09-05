import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Bell, BellOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePushSubscription } from "../hooks/usePushSubscription";

export function PushNotificationManager() {
  const { status: subscriptionStatus, userSubscriptions, subscribe, unsubscribe } =
    usePushSubscription();
  const handleSubscribe = subscribe;
  const handleUnsubscribe = unsubscribe;

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
      <div className="space-y-4 w-full">
        <div className="text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          {subscriptionStatus === "subscribed" ? (
            <div className="space-y-2">
              <p className="font-medium text-green-600 dark:text-green-400">
                Push notifications are active!
              </p>
              <p className="text-sm text-muted-foreground break-words">
                You'll receive notifications for draft picks, your turn, and chat messages.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium">Enable Push Notifications</p>
              <p className="text-sm text-muted-foreground break-words">
                Get notified about draft picks, your turn, and important league updates even when the app is closed.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center w-full">
          {subscriptionStatus === "subscribed" ? (
            <Button variant="outline" onClick={() => void handleUnsubscribe()} className="w-full sm:w-auto">
              <BellOff className="w-4 h-4 mr-2" />
              Disable Notifications
            </Button>
          ) : (
            <Button onClick={() => void handleSubscribe()} disabled={subscriptionStatus === "checking"} className="w-full sm:w-auto">
              <Bell className="w-4 h-4 mr-2" />
              Enable Notifications
            </Button>
          )}
        </div>

        {userSubscriptions && userSubscriptions.length > 0 && (
          <div className="pt-4 border-t w-full">
            <p className="text-sm text-muted-foreground mb-2">
              Active on {userSubscriptions.length} device{userSubscriptions.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2 w-full">
              {userSubscriptions.map((sub) => (
                <div key={sub._id} className="text-xs bg-muted p-2 rounded w-full overflow-hidden">
                  <p className="truncate w-full" title={sub.userAgent || "Unknown device"}>
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
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1 flex-1 min-w-0">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Bell className="w-5 h-5" />
            Push Notifications
          </h3>
          <p className="text-sm text-muted-foreground break-words">
            Get notified about league activity and your draft turns
          </p>
        </div>
        <div className="flex-shrink-0">
          {renderStatus()}
        </div>
      </div>
      
      <div className="border rounded-lg p-4 w-full overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}