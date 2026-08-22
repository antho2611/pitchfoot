import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useLocation,
  useNavigate,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportClientError } from "../lib/error-reporting";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Breadcrumb } from "@/components/Breadcrumb";

const notFoundActions = [
  { href: "/", label: "Retour à l'accueil", primary: true },
  { href: "/joueurs", label: "Voir les joueurs" },
  { href: "/clubs", label: "Voir les clubs" },
  { href: "/annonces", label: "Voir les annonces" },
];

function NotFoundComponent() {
  // notFoundComponent n'est pas une route avec son propre head() — un
  // <title> rendu directement en JSX serait hoisté par React 19 en PLUS de
  // celui de la racine (deux <title> dans le HTML), pas à sa place. Un
  // effet ciblant document.title reste le seul moyen fiable de le remplacer.
  useEffect(() => {
    document.title = "Page introuvable — PitchPro";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Page introuvable" }]} />
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center sm:py-24">
        <h1 className="font-display text-8xl text-foreground">404</h1>
        <h2 className="mt-2 font-display text-2xl uppercase">Page introuvable</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée. Voici quelques endroits utiles pour repartir :
        </p>
        {/* Boutons d'action visibles immédiatement, sans scroll. */}
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          {notFoundActions.map((action) => (
            <a
              key={action.href}
              href={action.href}
              className={
                action.primary
                  ? "inline-flex items-center justify-center bg-pitch px-5 py-2.5 font-display text-lg uppercase text-volt transition-colors hover:bg-field"
                  : "inline-flex items-center justify-center border border-border px-5 py-2.5 font-display text-lg uppercase transition-colors hover:border-pitch"
              }
            >
              {action.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportClientError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl uppercase">Cette page n'a pas pu se charger</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Une erreur est survenue. Réessayez ou revenez à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-pitch px-5 py-2.5 font-display text-lg uppercase text-volt"
          >
            Réessayer
          </button>
          <a href="/" className="border border-border px-5 py-2.5 font-display text-lg uppercase">
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
      },
      { title: "PitchPro — Le réseau du recrutement football amateur" },
      {
        name: "description",
        content:
          "Joueurs, créez votre profil sportif. Clubs, publiez vos annonces et recrutez. PitchPro est le réseau du football amateur et semi-professionnel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "PitchPro — Le réseau du recrutement football amateur" },
      { name: "twitter:title", content: "PitchPro — Le réseau du recrutement football amateur" },
      {
        property: "og:description",
        content:
          "Joueurs, créez votre profil sportif. Clubs, publiez vos annonces et recrutez. PitchPro est le réseau du football amateur et semi-professionnel.",
      },
      {
        name: "twitter:description",
        content:
          "Joueurs, créez votre profil sportif. Clubs, publiez vos annonces et recrutez. PitchPro est le réseau du football amateur et semi-professionnel.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;900&display=swap",
      },
      { rel: "icon", href: "/favicon.ico?v=2", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png?v=2" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthSync() {
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);
  return null;
}

function OnboardingGate() {
  const { user, accountType, profileCompleted, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    if (accountType === "admin" || profileCompleted) return;
    if (pathname === "/profil") return;
    navigate({ to: "/profil" });
  }, [loading, user, accountType, profileCompleted, pathname, navigate]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthSync />
        <OnboardingGate />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
