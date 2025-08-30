// Push notification service worker extension

// Handle push notifications
self.addEventListener('push', function(event) {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('Failed to parse push data:', e);
    return;
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    tag: data.tag,
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    timestamp: data.timestamp || Date.now(),
    vibrate: data.vibrate || [200, 100, 200],
  };

  // Show notification
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  const notification = event.notification;
  const data = notification.data || {};
  
  notification.close();

  // Track notification click
  if (typeof self.clients !== 'undefined') {
    self.clients.matchAll().then(function(clientList) {
      if (clientList.length > 0) {
        // Send analytics event to client
        clientList[0].postMessage({
          type: 'NOTIFICATION_CLICKED',
          data: {
            action: event.action || 'default',
            notificationType: data.type,
            leagueId: data.leagueId,
            timestamp: Date.now()
          }
        });
      }
    });
  }

  // Handle action button clicks
  if (event.action) {
    switch (event.action) {
      case 'view-draft':
      case 'view-league':
      case 'view-chat':
        // Open the app to the specific league
        event.waitUntil(
          clients.openWindow(data.url || '/')
        );
        break;
        
      case 'make-pick':
        // Open the app to make a draft pick
        event.waitUntil(
          clients.openWindow(data.url || '/')
        );
        break;
        
      case 'reply':
        // Open the app to the chat
        event.waitUntil(
          clients.openWindow(data.url || '/')
        );
        break;
        
      case 'dismiss':
        // Just close the notification (already done above)
        break;
        
      default:
        event.waitUntil(
          clients.openWindow(data.url || '/')
        );
    }
  } else {
    // Default click behavior - open the app
    event.waitUntil(
      clients.openWindow(data.url || '/')
    );
  }
});

// Handle notification close events
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
  
  const notification = event.notification;
  const data = notification.data || {};
  
  // Track notification dismissal if needed
  if (data.trackClose) {
    // Could send analytics or update backend
    console.log('Notification dismissed:', data);
  }
});

// Background sync for offline notifications (future enhancement)
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  // This could sync offline notifications when connection is restored
  try {
    console.log('Syncing offline notifications...');
    // Implementation would check for queued notifications and send them
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}

// Update badge count (for supported browsers)
function updateBadgeCount(count) {
  if ('setAppBadge' in navigator) {
    navigator.setAppBadge(count);
  } else if ('setExperimentalAppBadge' in navigator) {
    navigator.setExperimentalAppBadge(count);
  }
}

// Clear badge when app is focused
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    updateBadgeCount(0);
  } else if (event.data && event.data.type === 'UPDATE_BADGE') {
    updateBadgeCount(event.data.count || 0);
  }
});

console.log('Push notification service worker loaded');