import { PushNotificationManager } from "../components/PushNotificationManager";
import { NotificationSettings } from "../components/NotificationSettings";

export function NotificationTestPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Push Notifications Test</h1>
          <p className="text-muted-foreground">
            Test and configure push notifications for LowEffort.bet
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <div className="space-y-6">
            <PushNotificationManager />
          </div>
          
          <div className="space-y-6">
            <NotificationSettings showGlobalSettings={true} />
          </div>
        </div>

        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">How to Test Push Notifications</h2>
          <div className="space-y-4 text-sm">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">1. Enable Push Notifications</h3>
              <p>Click "Enable Notifications" above and grant permission when prompted by your browser.</p>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">2. Send Test Notification</h3>
              <p>Use the "Send Test" button in the notification settings to verify notifications work.</p>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">3. Test League Activities</h3>
              <p>Join a league and try these activities to test automatic notifications:</p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Start a draft</li>
                <li>• Make a draft pick</li>
                <li>• Send a chat message</li>
                <li>• Add new participants</li>
              </ul>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">4. Test Offline Notifications</h3>
              <p>Close the app (or minimize the browser) and ask another user to trigger activities. You should receive notifications even with the app closed.</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">Browser Support</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">✅ Full Support</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Chrome/Edge (Desktop & Mobile)</li>
                <li>• Firefox (Desktop & Mobile)</li>
                <li>• Samsung Internet</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="font-medium text-yellow-800 mb-2">⚠️ Limited Support</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Safari (macOS only)</li>
                <li>• iOS Safari (PWA mode only)</li>
              </ul>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-medium text-red-800 mb-2">❌ No Support</h3>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Internet Explorer</li>
                <li>• Older browsers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}