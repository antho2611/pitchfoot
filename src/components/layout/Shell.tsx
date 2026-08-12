import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Menu, MessageSquare, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/joueurs", label: "Joueurs" },
  { to: "/annonces", label: "Annonces" },
  { to: "/clubs", label: "Clubs" },
  { to: "/preparateurs", label: "Préparateurs" },
  { to: "/seances", label: "Séances" },
  { to: "/ebooks", label: "Ebooks" },
  { to: "/premium", label: "Premium" },
];

export function Header() {
  const { user, displayName } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-pitch/10 bg-background/85 backdrop-blur-md">
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
                onClick={signOut}
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
          <button
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      <div
        aria-hidden={!open}
        className={`grid overflow-hidden bg-card transition-[grid-template-rows] duration-300 ease-out md:hidden ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden border-t border-border px-4 py-4">
          <div className="flex flex-col gap-3 text-sm font-medium uppercase tracking-wider">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/tableau-de-bord" onClick={() => setOpen(false)}>
                  Tableau de bord
                </Link>
                <Link to="/bibliotheque" onClick={() => setOpen(false)}>
                  Ma bibliothèque
                </Link>
                <Link to="/messages" onClick={() => setOpen(false)}>
                  Messagerie
                </Link>
                <Link to="/notifications" onClick={() => setOpen(false)}>
                  Notifications
                </Link>
                <button className="text-left uppercase" onClick={signOut}>
                  Se déconnecter
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)}>
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-pitch py-12 text-white/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
        <span className="font-display text-2xl text-white">
          PITCH<span className="bg-volt px-1 text-pitch">PRO</span>
        </span>
        <p className="text-xs uppercase tracking-widest">
          © {new Date().getFullYear()} PitchPro — Recrutement football amateur
        </p>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
