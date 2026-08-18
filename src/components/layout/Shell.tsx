import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dumbbell, Megaphone, Menu, MessageSquare, Shield, Users, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NotificationsBell } from "@/components/NotificationsBell";

/** Ressort critiquement amorti — le défaut Apple pour toute UI qui ne porte pas d'élan gestuel. */
const SPRING = { type: "spring", bounce: 0, duration: 0.35 } as const;
/** Espace entre la barre flottante et le bord de l'écran. */
const TAB_BAR_GAP = "0.75rem";
/** Espace total réservé en bas (barre + marges + zone de sécurité iOS) — utilisé pour ne pas passer sous la barre. */
const TAB_BAR_CLEARANCE = `calc(4rem + 1.5rem + env(safe-area-inset-bottom))`;

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
              <NotificationsBell />
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

const tabItemCls = "relative flex flex-1 items-center justify-center py-2.5";

/** Contenu d'un onglet, avec la pastille active partagée (layoutId) qui se déforme d'un onglet à l'autre. */
function TabPill({
  isActive,
  reduceMotion,
  children,
}: {
  isActive: boolean;
  reduceMotion: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      {isActive && (
        <motion.div
          layoutId="tab-pill"
          transition={reduceMotion ? { duration: 0.01 } : SPRING}
          className="glass-pill absolute inset-1 rounded-full"
        />
      )}
      <span
        className={`relative z-10 flex flex-col items-center gap-0.5 transition-colors ${
          isActive ? "text-pitch" : "text-foreground/40"
        }`}
      >
        {children}
      </span>
    </>
  );
}

/** Barre d'onglets flottante en verre, pilule ancrée en bas — convention native iOS (Liquid Glass). */
export function MobileTabBar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

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
            style={{ bottom: TAB_BAR_CLEARANCE }}
            className="glass fixed inset-x-4 z-40 max-h-[60vh] overflow-auto rounded-2xl border-t-0 md:hidden"
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
        className="glass fixed inset-x-4 z-50 flex h-16 rounded-full border-t-0 md:hidden"
        style={{ bottom: `calc(${TAB_BAR_GAP} + env(safe-area-inset-bottom))` }}
      >
        {TABS.map((tab) => {
          const isActive = pathname === tab.to || pathname.startsWith(`${tab.to}/`);
          return (
            <Link key={tab.to} to={tab.to} onClick={() => setOpen(false)} className={tabItemCls}>
              <TabPill isActive={isActive} reduceMotion={!!reduceMotion}>
                <tab.icon className="size-5" />
                <span className="text-[10px] font-bold uppercase tracking-wide">{tab.label}</span>
              </TabPill>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={tabItemCls}
        >
          <TabPill isActive={open} reduceMotion={!!reduceMotion}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
            <span className="text-[10px] font-bold uppercase tracking-wide">Menu</span>
          </TabPill>
        </button>
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
      <main className="flex-1 pb-[calc(4rem+1.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}
