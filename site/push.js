/* Web Push opt-in for the PWA.
   The menu button (#notifBtn) is revealed only where the Push API is available
   and drives: permission → pushManager.subscribe() → POST /api/subscribe. */
(() => {
  const cfg = window.PUSH_CONFIG || {};
  const btn = document.getElementById("notifBtn");

  // VAPID keys are URL-safe base64; PushManager expects a raw Uint8Array.
  function urlBase64ToUint8Array(base64) {
    const pad = "=".repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    return new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
  }

  function supported() {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  // The SW is usually already registered (workbox-window on page load); fall
  // back to a plain registration so a subscribe is never blocked on a timing
  // race with the load handler.
  async function ensureRegistration() {
    return (
      (await navigator.serviceWorker.getRegistration()) ||
      navigator.serviceWorker.register("sw.js")
    );
  }

  function applyState(state) {
    if (!btn) return;
    if (state === "unsupported") {
      btn.hidden = true;
    } else if (state === "enabled") {
      btn.textContent = "🔔 Practice reminders on";
      btn.disabled = true;
      btn.hidden = false;
    } else if (state === "denied") {
      btn.textContent = "🔕 Notifications blocked";
      btn.disabled = true;
      btn.hidden = false;
    } else {
      btn.textContent = "🔔 Enable practice reminders";
      btn.disabled = false;
      btn.hidden = false;
    }
  }

  function currentState() {
    if (!supported()) return "unsupported";
    if (Notification.permission === "granted") return "enabled";
    if (Notification.permission === "denied") return "denied";
    return "default";
  }

  async function enable() {
    if (!supported()) return;
    let permission = Notification.permission;
    if (permission !== "granted" && permission !== "denied") {
      // Prompt only from this user gesture (required on iOS installed PWAs).
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") {
      applyState("denied");
      return;
    }

    try {
      const reg = await ensureRegistration();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(cfg.vapidPublicKey),
      });
      await fetch(cfg.apiBase + "/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      applyState("enabled");
    } catch (err) {
      console.error("subscribe failed", err);
      applyState("default");
    }
  }

  if (btn) btn.addEventListener("click", enable);
  applyState(currentState());
})();
