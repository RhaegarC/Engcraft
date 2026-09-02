// Web Push configuration for the PWA.
// The VAPID public key is public by design; the private key lives only in the
// Function app settings (and api/EngFun/local.settings.json for local runs).
window.PUSH_CONFIG = {
  // Base URL of the push Azure Function. Local runs use `func start` (port
  // 7071). For phone tests, point this at the deployed Function App URL.
  apiBase: "http://localhost:7071",
  vapidPublicKey:
    "BOWWE4lfishQWv0jQ6sZOMStYMeW1AIms0AF8ilpsEeBF0RRhQY0MHvbWuuY5Y-axGepJo3wIWljWwIfso0HTiU",
};
