import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell, Dumbbell, Megaphone, Menu, MessageSquare, Shield, Users, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/** Ressort critiquement amorti — le défaut Apple pour toute UI qui ne porte pas d'élan gestuel. */
const SPRING = { type: "spring", bounce: 0, duration: 0.35 } as const;
/** Hauteur totale de la barre d'onglets mobile, zone de sécurité iOS comprise. */
const TAB_BAR_H = "calc(4rem + env(safe-area-inset-bottom))";

const NAV = [
  { to: "/joueurs", label: "Joueurs" },
  { to: "/annonces", label: "Annonces" },
  { to: "/clubs", label: "Clubs" },
  { to: "/preparateurs", label: "Préparateurs" },
  { to: "/seances", label: "Séances" },
  { to: "/ebooks", label: "Ebooks" },
  { to: "/premium", label: "Premium" },
];

const TABS = [
  { to: "/joueurs", label: "Joueurs", icon: Users },
  { to: "/annonces", label: "Annonces", icon: Megaphone },
  { to: "/clubs", label: "Clubs", icon: Shield },
  { to: "/seances", label: "Séances", icon: Dumbbell },
] as const;

export function Header() {
  const { user, displayName } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (!cancelled) setUnread(count ?? 0);
    };
    void load();
    const channel = supabase
      .channel("header-notifs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <nav className="glass sticky top-0 z-50 border-t-0 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link to="/" className="shrink-0 font-display text-3xl tracking-tight">
            PITCH<span className="bg-pitch px-1 text-volt">PRO</span>
          </Link>
          <div className="hidden gap-6 text-sm font-medium uppercase tracking-wider md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-foreground/60 transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/messages"
                className="hidden text-foreground/60 transition-colors hover:text-foreground sm:block"
                aria-label="Messagerie"
              >
                <MessageSquare className="size-5" />
              </Link>
              <Link
                to="/notifications"
                className="relative hidden text-foreground/60 transition-colors hover:text-foreground sm:block"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                {unread > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center bg-volt text-[9px] font-black text-pitch">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                to="/tableau-de-bord"
                className="hidden bg-pitch px-4 py-2 font-display text-lg uppercase text-volt transition-colors hover:bg-field sm:block"
              >
                Tableau de bord
              </Link>
              <button
                onClick={() => void supabase.auth.signOut()}
                className="hidden text-xs font-bold uppercase tracking-wider text-foreground/50 hover:text-foreground sm:block"
              >
                Sortir
              </button>
              <span className="sr-only">{displayName}</span>
            </>
          ) : (
            <Link
              to="/auth"
              className="hidden bg-pitch px-4 py-2 font-display text-lg uppercase text-volt transition-colors hover:bg-field sm:block"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

/** Barre d'onglets flottante en verre, ancrée en bas — convention native iOS. */
export function MobileTabBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const tabCls =
    "flex flex-1 flex-col items-center gap-1 py-2 text-foreground/40 transition-colors [&.active]:text-pitch";

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="tab-sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={reduceMotion ? { duration: 0.01 } : SPRING}
            style={{ bottom: TAB_BAR_H }}
            className="glass fixed inset-x-0 z-40 max-h-[60vh] overflow-auto border-t-0 md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4 text-sm font-medium uppercase tracking-wider">
              <Link to="/preparateurs" onClick={() => setOpen(false)} className="py-2">
                Préparateurs
              </Link>
              <Link to="/ebooks" onClick={() => setOpen(false)} className="py-2">
                Ebooks
              </Link>
              <Link to="/premium" onClick={() => setOpen(false)} className="py-2">
                Premium
              </Link>
              <div className="my-2 border-t border-border" />
              {user ? (
                <>
                  <Link to="/tableau-de-bord" onClick={() => setOpen(false)} className="py-2">
                    Tableau de bord
                  </Link>
                  <Link to="/bibliotheque" onClick={() => setOpen(false)} className="py-2">
                    Ma bibliothèque
                  </Link>
                  <Link to="/messages" onClick={() => setOpen(false)} className="py-2">
                    Messagerie
                  </Link>
                  <Link to="/notifications" onClick={() => setOpen(false)} className="py-2">
                    Notifications
                  </Link>
                  <button className="py-2 text-left uppercase" onClick={() => void signOut()}>
                    Se déconnecter
                  </button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="py-2">
                  Connexion
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        className="glass fixed inset-x-0 bottom-0 z-50 border-t md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16">
          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              onClick={() => setOpen(false)}
              className={tabCls}
              activeProps={{ className: "active" }}
            >
              <tab.icon className="size-5" />
              <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`${tabCls} ${open ? "active" : ""}`}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="text-[10px] font-bold uppercase tracking-wide">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-pitch py-12 text-white/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
        <span className="font-display text-2xl text-white">
          PITCH<span className="bg-volt px-1 text-pitch">PRO</span>
        </span>
        <div className="flex flex-col gap-4 text-xs uppercase tracking-widest sm:flex-row sm:items-center sm:gap-6">
          <Link to="/mentions-legales" className="hover:text-white">
            Mentions légales
          </Link>
          <Link to="/cgu" className="hover:text-white">
            CGU
          </Link>
          <Link to="/confidentialite" className="hover:text-white">
            Confidentialité
          </Link>
          <p>© {new Date().getFullYear()} PitchPro — Recrutement football amateur</p>
        </div>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}
