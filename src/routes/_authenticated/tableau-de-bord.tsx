import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Eye, FileText, Inbox, Users } from "lucide-react";
import { formatSessionDate, sessionStatusLabel } from "@/lib/coaches";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { openConversation, notify } from "@/lib/messaging";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — PitchPro" },
      { name: "description", content: "Pilotez votre profil, vos annonces et vos candidatures." },
      { property: "og:title", content: "Tableau de bord — PitchPro" },
      { property: "og:description", content: "Votre espace personnel PitchPro." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, accountType, displayName } = useAuth();

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="label-xs text-foreground/40">
              {accountType === "club"
                ? "Espace club"
                : accountType === "admin"
                  ? "Admin"
                  : accountType === "coach"
                    ? "Espace préparateur"
                    : "Espace joueur"}
            </p>
            <h1 className="truncate font-display text-5xl uppercase">{displayName || "Bienvenue"}</h1>
          </div>
          <Link
            to="/profil"
            className="shrink-0 bg-pitch px-5 py-2.5 font-display text-lg uppercase text-volt"
          >
            Mon profil
          </Link>
        </div>

        {accountType === "club" ? (
          <ClubDashboard userId={user!.id} />
        ) : accountType === "admin" ? (
          <AdminShortcut />
        ) : accountType === "coach" ? (
          <CoachDashboard userId={user!.id} />
        ) : (
          <PlayerDashboard userId={user!.id} />
        )}
      </section>
    </PageShell>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="bg-card p-5">
      <Icon className="size-5 text-volt" />
      <p className="label-xs mt-3 text-foreground/40">{label}</p>
      <p className="font-display text-4xl">{value}</p>
    </div>
  );
}

function PlayerDashboard({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["player-dashboard", userId],
    queryFn: async () => {
      const [player, apps, views, saved] = await Promise.all([
        supabase.from("players").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("applications")
          .select("*, listings(title), clubs(name)")
          .eq("player_id", userId)
          .order("created_at", { ascending: false }),
        supabase.from("profile_views").select("id", { count: "exact", head: true }).eq("player_id", userId),
        supabase.from("saved_players").select("id", { count: "exact", head: true }).eq("player_id", userId),
      ]);
      return {
        player: player.data,
        applications: apps.data ?? [],
        views: views.count ?? 0,
        saved: saved.count ?? 0,
      };
    },
  });

  const completion = (() => {
    const p = data?.player;
    if (!p) return 0;
    const fields = [p.first_name, p.last_name, p.main_position, p.birth_date, p.city, p.level, p.bio, p.photo_url];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  })();

  return (
    <div className="mt-10 space-y-10">
      <div className="grid gap-px bg-border sm:grid-cols-3">
        <Stat icon={Eye} label="Vues du profil" value={data?.views ?? 0} />
        <Stat icon={Users} label="Clubs intéressés" value={data?.saved ?? 0} />
        <Stat icon={FileText} label="Candidatures" value={data?.applications.length ?? 0} />
      </div>

      <div className="border border-border bg-card p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <h2 className="font-display text-3xl uppercase">Profil complété</h2>
          <span className="font-display text-3xl">{completion}%</span>
        </div>
        <div className="mt-3 h-2 w-full bg-secondary">
          <div className="h-2 bg-volt" style={{ width: `${completion}%` }} />
        </div>
        {completion < 100 && (
          <Link to="/profil" className="label-xs mt-3 inline-block underline underline-offset-4">
            Compléter mon profil
          </Link>
        )}
      </div>

      <div>
        <h2 className="font-display text-4xl uppercase">Mes candidatures</h2>
        {data?.applications.length ? (
          <div className="mt-4 space-y-3">
            {data.applications.map((a) => (
              <div key={a.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-border bg-card p-4">
                <div className="min-w-0">
                  <p className="truncate font-display text-xl uppercase">{a.listings?.title ?? "Annonce"}</p>
                  <p className="label-xs text-foreground/40">{a.clubs?.name ?? "Club"}</p>
                </div>
                <span className="label-xs shrink-0 bg-secondary px-2 py-1">{a.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune candidature.{" "}
            <Link to="/annonces" className="underline underline-offset-4">
              Voir les annonces
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

function ClubDashboard({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const { data, refetch } = useQuery({
    queryKey: ["club-dashboard", userId],
    queryFn: async () => {
      const [listings, apps, saved] = await Promise.all([
        supabase.from("listings").select("*").eq("club_id", userId).order("created_at", { ascending: false }),
        supabase
          .from("applications")
          .select("*, listings(title), players(id, first_name, last_name, main_position)")
          .eq("club_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("saved_players")
          .select("*, players(id, first_name, last_name, main_position, current_club)")
          .eq("club_id", userId),
      ]);
      return { listings: listings.data ?? [], applications: apps.data ?? [], saved: saved.data ?? [] };
    },
  });

  async function setStatus(id: string, status: string, playerId: string) {
    const { error } = await supabase.from("applications").update({ status }).eq("id", id);
    if (error) return toast.error("Mise à jour impossible.");
    await notify(playerId, "application", "Candidature mise à jour", `Statut : ${status}`, "/tableau-de-bord");
    toast.success("Candidature mise à jour.");
    void refetch();
  }

  async function message(playerId: string) {
    const cid = await openConversation(userId, playerId);
    navigate({ to: "/messages", search: { c: cid } });
  }

  return (
    <div className="mt-10 space-y-10">
      <div className="grid gap-px bg-border sm:grid-cols-3">
        <Stat icon={FileText} label="Annonces" value={data?.listings.length ?? 0} />
        <Stat icon={Inbox} label="Candidatures" value={data?.applications.length ?? 0} />
        <Stat icon={Users} label="Short-list" value={data?.saved.length ?? 0} />
      </div>

      <div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <h2 className="font-display text-4xl uppercase">Mes annonces</h2>
          <Link to="/annonces/nouvelle" className="shrink-0 bg-volt px-4 py-2 font-display text-lg uppercase text-pitch">
            Publier
          </Link>
        </div>
        {data?.listings.length ? (
          <div className="mt-4 space-y-3">
            {data.listings.map((l) => (
              <Link
                key={l.id}
                to="/annonces/$id"
                params={{ id: l.id }}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-display text-xl uppercase">{l.title}</p>
                  <p className="label-xs text-foreground/40">
                    {[l.position, l.level, l.city].filter(Boolean).join(" • ")}
                  </p>
                </div>
                <span className="label-xs shrink-0 bg-secondary px-2 py-1">
                  {l.is_open ? "Ouverte" : "Fermée"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Aucune annonce publiée.</p>
        )}
      </div>

      <div>
        <h2 className="font-display text-4xl uppercase">Candidatures reçues</h2>
        {data?.applications.length ? (
          <div className="mt-4 space-y-3">
            {data.applications.map((a) => (
              <div key={a.id} className="border border-border bg-card p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-display text-xl uppercase">
                      {a.players?.first_name} {a.players?.last_name}
                    </p>
                    <p className="label-xs text-foreground/40">
                      {a.players?.main_position} • {a.listings?.title}
                    </p>
                    {a.message && <p className="mt-2 text-sm text-muted-foreground">{a.message}</p>}
                  </div>
                  <span className="label-xs shrink-0 bg-secondary px-2 py-1">{a.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatus(a.id, "acceptee", a.player_id)}
                    className="bg-pitch px-3 py-1.5 font-display text-base uppercase text-volt"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => setStatus(a.id, "refusee", a.player_id)}
                    className="border border-border px-3 py-1.5 font-display text-base uppercase"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => message(a.player_id)}
                    className="border border-border px-3 py-1.5 font-display text-base uppercase"
                  >
                    Message
                  </button>
                  <Link
                    to="/joueurs/$id"
                    params={{ id: a.player_id }}
                    className="px-3 py-1.5 font-display text-base uppercase underline"
                  >
                    Profil
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Aucune candidature reçue.</p>
        )}
      </div>

      <div>
        <h2 className="font-display text-4xl uppercase">Short-list</h2>
        {data?.saved.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.saved.map((s) => (
              <Link
                key={s.id}
                to="/joueurs/$id"
                params={{ id: s.player_id }}
                className="border border-border bg-card p-4"
              >
                <p className="truncate font-display text-xl uppercase">
                  {s.players?.first_name} {s.players?.last_name}
                </p>
                <p className="label-xs text-foreground/40">
                  {[s.players?.main_position, s.players?.current_club].filter(Boolean).join(" • ")}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Aucun joueur sauvegardé.</p>
        )}
      </div>
    </div>
  );
}

function AdminShortcut() {
  return (
    <div className="mt-10 border border-border bg-card p-8">
      <h2 className="font-display text-3xl uppercase">Console d'administration</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Modération des profils, annonces et signalements.
      </p>
      <Link to="/admin" className="mt-4 inline-block bg-pitch px-5 py-2.5 font-display text-lg uppercase text-volt">
        Ouvrir la console
      </Link>
    </div>
  );
}

function CoachDashboard({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["coach-dashboard", userId],
    queryFn: async () => {
      const [coach, ads] = await Promise.all([
        supabase.from("preparateurs").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("coach_annonces")
          .select("id, title, status, session_date, start_time, end_time, city")
          .eq("coach_id", userId)
          .order("session_date", { ascending: false }),
      ]);
      return { coach: coach.data, ads: ads.data ?? [] };
    },
  });

  const ads = data?.ads ?? [];
  const active = ads.filter((a) => a.status === "active").length;

  return (
    <div className="mt-10 space-y-8">
      <div className="grid gap-px bg-border sm:grid-cols-3">
        <Stat icon={CalendarDays} label="Séances publiées" value={ads.length} />
        <Stat icon={CalendarDays} label="Séances actives" value={active} />
        <Stat icon={Eye} label="Vues du profil" value={data?.coach?.views_count ?? 0} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl uppercase">Mes dernières séances</h2>
          <Link to="/profil" className="text-xs uppercase tracking-widest underline">
            Gérer mes annonces
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {ads.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Publiez votre première séance depuis votre profil.
            </p>
          )}
          {ads.slice(0, 5).map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 border border-border bg-card p-4"
            >
              <span className="font-display text-xl uppercase leading-none">{a.title}</span>
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {formatSessionDate(a.session_date, a.start_time, a.end_time)}
                {a.city ? ` · ${a.city}` : ""} · {sessionStatusLabel(a.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Link
        to="/preparateurs/$id"
        params={{ id: userId }}
        className="inline-block border-2 border-pitch px-6 py-3 font-display text-xl uppercase"
      >
        Voir ma fiche publique
      </Link>
    </div>
  );
}
