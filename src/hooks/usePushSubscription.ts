import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export type PushStatus =
  | "checking"
  | "supported"
  | "unsupported"
  | "denied"
  | "subscribed"
  | "unsubscribed";

/**
 * iOS only delivers web push to apps launched from the Home Screen. Detect the
 * case where a Safari-tab user needs to install first.
 */
export function needsHomeScreenInstall(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  if (!isIOS) return false;
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return !standalone;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return window.btoa(binary);
}

/** Shared push-subscription state and actions for the settings panel and nudges. */
export function usePushSubscription() {
  const [status, setStatus] = useState<PushStatus>("checking");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const vapidPublicKey = useQuery(api.pushNotifications.getVapidPublicKey);
  const subscribeMutation = useMutation(api.pushNotifications.subscribe);
  const unsubscribeMutation = useMutation(api.pushNotifications.unsubscribe);
  const userSubscriptions = useQuery(api.pushNotifications.getUserSubscriptions);

  // Detect support and any existing browser-side subscription once.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      try {
        const permission = Notification.permission;
        if (permission === "denied") {
          setStatus("denied");
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (cancelled) return;
        if (existing) {
          setSubscription(existing);
          setStatus("checking"); // resolved below once server data arrives
        } else {
          setStatus(permission === "granted" ? "unsubscribed" : "supported");
        }
      } catch (error) {
        console.error("Error checking notification support:", error);
        if (!cancelled) setStatus("unsupported");
      }
    };
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  // A browser subscription only counts if the server still knows about it.
  useEffect(() => {
    if (!subscription || userSubscriptions === undefined) return;
    const known = userSubscriptions.some(
      (sub) => sub.endpoint === subscription.endpoint && sub.isActive,
    );
    setStatus(known ? "subscribed" : "unsubscribed");
  }, [subscription, userSubscriptions]);

  const subscribe = useCallback(async () => {
    if (!vapidPublicKey) {
      toast.error("VAPID key not available");
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setStatus("denied");
        toast.error("Notifications are blocked for this site. Allow them in your browser settings to enable.");
        return false;
      }
      if (permission !== "granted") {
        // "default": the prompt was dismissed without a choice; the user can try again.
        setStatus("supported");
        toast.info("No problem. You can enable notifications any time from the menu.");
        return false;
      }
      const registration = await navigator.serviceWorker.ready;
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }
      const p256dhKey = sub.getKey("p256dh");
      const authKey = sub.getKey("auth");
      if (!p256dhKey || !authKey) {
        toast.error("Failed to setup push notifications - invalid subscription keys");
        return false;
      }
      await subscribeMutation({
        endpoint: sub.endpoint,
        p256dhKey: arrayBufferToBase64(p256dhKey),
        authKey: arrayBufferToBase64(authKey),
        userAgent: navigator.userAgent,
      });
      setSubscription(sub);
      setStatus("subscribed");
      toast.success("Push notifications enabled!");
      return true;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      toast.error("Failed to enable push notifications");
      return false;
    }
  }, [vapidPublicKey, subscribeMutation]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    try {
      await subscription.unsubscribe();
      await unsubscribeMutation({ endpoint: subscription.endpoint });
      setSubscription(null);
      setStatus("unsubscribed");
      toast.success("Push notifications disabled");
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      toast.error("Failed to disable push notifications");
    }
  }, [subscription, unsubscribeMutation]);

  return { status, userSubscriptions, subscribe, unsubscribe };
}
