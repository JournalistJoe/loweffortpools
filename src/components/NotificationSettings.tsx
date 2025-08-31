import { useState, ReactNode } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Bell, BellOff, MessageCircle, Trophy, User, Zap } from "lucide-react";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface NotificationSettingsProps {
  leagueId?: Id<"leagues">;
  showGlobalSettings?: boolean;
}

interface NotificationToggleItemProps {
  icon: ReactNode;
  iconColor: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

function NotificationToggleItem({
  icon,
  iconColor,
  title,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: NotificationToggleItemProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-0 rounded-lg border sm:border-none bg-muted/30 sm:bg-transparent w-full">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`w-5 h-5 sm:w-4 sm:h-4 ${iconColor} mt-0.5 flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <Label className="font-medium text-base sm:text-sm break-words">{title}</Label>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed break-words">
            {description}
          </p>
        </div>
      </div>
      <div className="flex justify-end sm:justify-center flex-shrink-0">
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export function NotificationSettings({ leagueId, showGlobalSettings = false }: NotificationSettingsProps) {
  const [muteFor, setMuteFor] = useState<string>("0");

  const preferences = useQuery(api.pushNotifications.getNotificationPreferences, {
    leagueId: leagueId || undefined,
  });
  
  const updatePreferences = useMutation(api.pushNotifications.updateNotificationPreferences);
  const currentUser = useQuery(api.auth.loggedInUser);

  const handleToggle = async (setting: string, value: boolean) => {
    try {
      await updatePreferences({
        leagueId: leagueId || undefined,
        [setting]: value,
      });
      toast.success("Notification preferences updated");
    } catch (error) {
      toast.error("Failed to update preferences");
      console.error("Error updating preferences:", error);
    }
  };

  const handleMuteFor = async (hours: string) => {
    const hoursNum = parseInt(hours);
    const mutedUntil = hoursNum > 0 ? Date.now() + (hoursNum * 60 * 60 * 1000) : null;
    
    try {
      await updatePreferences({
        leagueId: leagueId || undefined,
        mutedUntil,
      });
      
      if (hoursNum > 0) {
        toast.success(`Notifications muted for ${hoursNum} hour${hoursNum !== 1 ? 's' : ''}`);
      } else {
        toast.success("Notifications unmuted");
      }
    } catch (error) {
      toast.error("Failed to update mute settings");
      console.error("Error updating mute settings:", error);
    }
  };


  if (!preferences) {
    return (
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Bell className="w-5 h-5" />
          Notification Settings
        </h3>
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2" />
              <p>Loading notification settings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isMuted = preferences.mutedUntil && preferences.mutedUntil > Date.now();
  const muteTimeRemaining = isMuted 
    ? Math.ceil((preferences.mutedUntil! - Date.now()) / (60 * 60 * 1000))
    : 0;

  return (
    <div className="space-y-6 w-full">
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          <h3 className="flex items-center gap-2 text-lg font-semibold flex-wrap">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>Notification Settings</span>
            {!showGlobalSettings && leagueId && (
              <Badge variant="secondary" className="text-xs">League Specific</Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground break-words">
            {showGlobalSettings 
              ? "Default notification preferences for all leagues"
              : preferences?.isUsingGlobalDefaults
                ? "Using global defaults - customize below to override for this league"
                : "Customize notifications for this league"
            }
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3 sm:items-center flex-shrink-0">
          {preferences?.isUsingGlobalDefaults && !showGlobalSettings && (
            <Badge variant="outline" className="text-blue-600 border-blue-600 self-start sm:self-center">
              <Bell className="w-3 h-3 mr-1" />
              Using Global Defaults
            </Badge>
          )}
          {isMuted && (
            <Badge variant="outline" className="text-orange-600 border-orange-600 self-start sm:self-center">
              <BellOff className="w-3 h-3 mr-1" />
              Muted ({muteTimeRemaining}h left)
            </Badge>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-6 w-full overflow-hidden">
        {/* Mute Controls */}
        <div className="space-y-3 w-full">
          <Label className="text-sm font-medium">Temporary Mute</Label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
            <Select value={muteFor} onValueChange={setMuteFor}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Mute for..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Unmute</SelectItem>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="8">8 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => handleMuteFor(muteFor)}
              className="w-full sm:w-auto"
            >
              Apply
            </Button>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Temporarily disable all notifications for this {showGlobalSettings ? 'account' : 'league'}
          </p>
        </div>

        <div className="border-t pt-6">
          <h4 className="text-base sm:text-sm font-medium mb-4">Notification Types</h4>
          <div className="space-y-5">
            {/* Important Only Toggle */}
            <NotificationToggleItem
              icon={<Zap />}
              iconColor="text-orange-500"
              title="Important Only"
              description="Only receive high-priority notifications (draft start, your turn)"
              checked={preferences.enableImportantOnly}
              onCheckedChange={(checked) => handleToggle("enableImportantOnly", checked)}
              disabled={isMuted}
            />

            {/* My Turn Toggle */}
            <NotificationToggleItem
              icon={<User />}
              iconColor="text-blue-500"
              title="My Turn"
              description="Get notified when it's your turn to draft"
              checked={preferences.enableMyTurn}
              onCheckedChange={(checked) => handleToggle("enableMyTurn", checked)}
              disabled={isMuted || preferences.enableImportantOnly}
            />

            {/* Draft Picks Toggle */}
            <NotificationToggleItem
              icon={<Trophy />}
              iconColor="text-yellow-500"
              title="Draft Picks"
              description="Notifications for all draft picks and draft events"
              checked={preferences.enableDraftPicks}
              onCheckedChange={(checked) => handleToggle("enableDraftPicks", checked)}
              disabled={isMuted || preferences.enableImportantOnly}
            />

            {/* Chat Messages Toggle */}
            <NotificationToggleItem
              icon={<MessageCircle />}
              iconColor="text-green-500"
              title="Chat Messages"
              description="New messages in league chat"
              checked={preferences.enableChatMessages}
              onCheckedChange={(checked) => handleToggle("enableChatMessages", checked)}
              disabled={isMuted || preferences.enableImportantOnly}
            />
          </div>
        </div>


        {/* Status Info */}
        <div className="border-t pt-6">
          <div className="text-sm sm:text-xs text-muted-foreground space-y-2 sm:space-y-1">
            <p className="leading-relaxed">• Notifications work even when the app is closed</p>
            <p className="leading-relaxed">• High-priority notifications may override "Important Only" setting</p>
            {showGlobalSettings ? (
              <p className="leading-relaxed">• These settings apply to all leagues unless overridden in specific leagues</p>
            ) : (
              <>
                <p className="leading-relaxed">• League settings override your global defaults</p>
                <p className="leading-relaxed">• Customize global defaults in your user menu (top right)</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}