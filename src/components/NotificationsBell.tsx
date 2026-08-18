import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const SPRING = { type: "spring", bounce: 0, duration: 0.3 } as const;

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (!user) {
      setNotifs([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (!cancelled) setNotifs(data ?? []);
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

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function openNotif(n: Notif) {
    setOpen(false);
    if (!n.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      setNotifs((prev) => prev.map((p) => (p.id === n.id ? { ...p, is_read: true } : p)));
    }
    if (n.link) navigate({ to: n.link });
  }

  if (!user) return null;

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative text-foreground/60 transition-colors hover:text-foreground"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid size-4 place-items-center bg-volt text-[9px] font-black text-pitch">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={reduceMotion ? { duration: 0.01 } : SPRING}
            className="glass-pill absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl"
          >
            <div className="max-h-96 overflow-y-auto">
              {notifs.length ? (
                notifs.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => void openNotif(n)}
                    className={`block w-full border-b border-border/50 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary/50 ${
                      n.is_read ? "" : "bg-volt/10"
                    }`}
                  >
                    <p className="font-display text-base uppercase leading-tight">{n.title}</p>
                    {n.body && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <p className="label-xs mt-1 text-foreground/40">
                      {new Date(n.created_at).toLocaleString("fr-FR")}
                    </p>
                  </button>
                ))
              ) : (
                <p className="p-6 text-center text-sm text-muted-foreground">Aucune notification.</p>
              )}
            </div>
            <button
              onClick={() => {
                setOpen(false);
                navigate({ to: "/notifications" });
              }}
              className="label-xs block w-full border-t border-border/50 py-3 text-center underline-offset-4 hover:underline"
            >
              Tout voir
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
