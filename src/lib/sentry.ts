import * as Sentry from "@sentry/react";

// DSN publique par design (comme la clé Supabase "publishable") : elle autorise
// uniquement l'envoi d'événements vers ce projet Sentry, rien d'autre.
const SENTRY_DSN = "https://f98c7a7e3b790f0c4701ba2b5afb0236@o4511933979099136.ingest.de.sentry.io/4511933986766928";

let initialized = false;

export function initSentry() {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });

  window.__errorReporter = {
    captureException: (error, context, options) => {
      Sentry.captureException(error, {
        extra: context,
        level: options?.severity ?? "error",
      });
    },
  };
}
