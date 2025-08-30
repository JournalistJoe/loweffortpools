import { useState, ReactNode } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-0 rounded-lg border sm:border-none bg-muted/30 sm:bg-transparent min-h-[60px] sm:min-h-[auto]">
      <div className="flex items-start gap-3">
        <div className={`w-5 h-5 sm:w-4 sm:h-4 ${iconColor} mt-0.5`}>
          {icon}
        </div>
        <div className="flex-1">
          <Label className="font-medium text-base sm:text-sm">{title}</Label>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="flex justify-end sm:justify-center">
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
    const mutedUntil = hoursNum > 0 ? Date.now() + (hoursNum * 60 * 60 * 1000) : undefined;
    
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2" />
              <p>Loading notification settings...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isMuted = preferences.mutedUntil && preferences.mutedUntil > Date.now();
  const muteTimeRemaining = isMuted 
    ? Math.ceil((preferences.mutedUntil! - Date.now()) / (60 * 60 * 1000))
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Notification Settings</span>
              {!showGlobalSettings && leagueId && (
                <Badge variant="secondary" className="text-xs ml-2">League Specific</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              {showGlobalSettings 
                ? "Default notification preferences for all leagues"
                : "Customize notifications for this league"
              }
            </CardDescription>
          </div>
          {isMuted && (
            <Badge variant="outline" className="text-orange-600 border-orange-600 self-start sm:self-center">
              <BellOff className="w-3 h-3 mr-1" />
              Muted ({muteTimeRemaining}h left)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mute Controls */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Temporary Mute</Label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Select value={muteFor} onValueChange={setMuteFor}>
              <SelectTrigger className="w-full sm:w-40 min-h-[44px]">
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
              className="min-h-[44px] w-full sm:w-auto"
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
            <p className="leading-relaxed">• You can customize settings for each league separately</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}