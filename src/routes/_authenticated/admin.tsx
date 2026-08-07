import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/Shell";
import { EbookAdmin } from "@/components/EbookAdmin";
import { SiteAssetsAdmin } from "@/components/SiteAssetsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — PitchPro" },
      { name: "description", content: "Modération des comptes, annonces et signalements." },
      { property: "og:title", content: "Administration — PitchPro" },
      { property: "og:description", content: "Console de modération PitchPro." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, accountType } = useAuth();

  const { data, refetch } = useQuery({
    queryKey: ["admin-data"],
    enabled: accountType === "admin",
    queryFn: async () => {
      const [players, clubs, listings, reports, subs] = await Promise.all([
        supabase.from("players").select("id, first_name, last_name, main_position, city").limit(100),
        supabase.from("clubs").select("id, name, is_verified, city").limit(100),
        supabase.from("listings").select("id, title, is_open, club_id").order("created_at", { ascending: false }).limit(100),
        supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      return {
        players: players.data ?? [],
        clubs: clubs.data ?? [],
        listings: listings.data ?? [],
        reports: reports.data ?? [],
        subs: subs.data ?? [],
      };
    },
  });

  if (accountType !== "admin") {
    return (
      <PageShell>
        <p className="mx-auto max-w-3xl px-6 py-24 text-center text-sm text-muted-foreground">
          Accès réservé aux administrateurs.
        </p>
      </PageShell>
    );
  }

  async function verifyClub(id: string, value: boolean) {
    const { error } = await supabase.from("clubs").update({ is_verified: value }).eq("id", id);
    toast[error ? "error" : "success"](error ? "Action impossible." : "Club mis à jour.");
    void refetch();
  }

  async function closeListing(id: string) {
    const { error } = await supabase.from("listings").update({ is_open: false }).eq("id", id);
    toast[error ? "error" : "success"](error ? "Action impossible." : "Annonce fermée.");
    void refetch();
  }

  async function resolveReport(id: string) {
    const { error } = await supabase.from("reports").update({ status: "traite" }).eq("id", id);
    toast[error ? "error" : "success"](error ? "Action impossible." : "Signalement traité.");
    void refetch();
  }

  async function setSubStatus(userId: string, status: "active" | "canceled") {
    const end = new Date();
    end.setMonth(end.getMonth() + 1);
    const { error } = await supabase
      .from("subscriptions")
      .update({
        status,
        current_period_end: status === "active" ? end.toISOString() : null,
      })
      .eq("user_id", userId);
    toast[error ? "error" : "success"](error ? "Action impossible." : "Abonnement mis à jour.");
    void refetch();
  }

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-5xl uppercase">Administration</h1>

        <div className="mt-8 grid gap-px bg-border sm:grid-cols-4">
          {[
            { l: "Joueurs", v: data?.players.length ?? 0 },
            { l: "Clubs", v: data?.clubs.length ?? 0 },
            { l: "Annonces", v: data?.listings.length ?? 0 },
            { l: "Signalements", v: data?.reports.filter((r) => r.status !== "traite").length ?? 0 },
          ].map((s) => (
            <div key={s.l} className="bg-card p-5">
              <p className="label-xs text-foreground/40">{s.l}</p>
              <p className="font-display text-4xl">{s.v}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 font-display text-4xl uppercase">Ebooks</h2>
        {user && <EbookAdmin adminId={user.id} />}
        {user && <SiteAssetsAdmin adminId={user.id} />}

        <h2 className="mt-12 font-display text-4xl uppercase">Abonnements</h2>
        <div className="mt-4 space-y-3">
          {data?.subs.length ? (
            data.subs.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="font-display text-xl uppercase">
                    {s.plan} — {s.status}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{s.user_id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => void setSubStatus(s.user_id, "active")}
                    className="bg-pitch px-3 py-1.5 text-xs font-bold uppercase text-volt"
                  >
                    Activer
                  </button>
                  <button
                    onClick={() => void setSubStatus(s.user_id, "canceled")}
                    className="border border-border px-3 py-1.5 text-xs font-bold uppercase"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Aucun abonnement.</p>
          )}
        </div>

        <h2 className="mt-12 font-display text-4xl uppercase">Signalements</h2>
        <div className="mt-4 space-y-3">
          {data?.reports.length ? (
            data.reports.map((r) => (
              <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-border bg-card p-4">
                <div className="min-w-0">
                  <p className="font-display text-xl uppercase">
                    {r.target_type} — {r.status}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{r.reason}</p>
                </div>
                {r.status !== "traite" && (
                  <button onClick={() => resolveReport(r.id)} className="shrink-0 bg-pitch px-4 py-2 font-display text-base uppercase text-volt">
                    Traiter
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Aucun signalement.</p>
          )}
        </div>

        <h2 className="mt-12 font-display text-4xl uppercase">Clubs</h2>
        <div className="mt-4 space-y-2">
          {data?.clubs.map((c) => (
            <div key={c.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-border bg-card p-3">
              <Link to="/clubs/$id" params={{ id: c.id }} className="truncate font-display text-lg uppercase">
                {c.name}
              </Link>
              <button
                onClick={() => verifyClub(c.id, !c.is_verified)}
                className="label-xs shrink-0 border border-border px-3 py-1.5"
              >
                {c.is_verified ? "Retirer la vérification" : "Vérifier"}
              </button>
            </div>
          ))}
        </div>

        <h2 className="mt-12 font-display text-4xl uppercase">Annonces</h2>
        <div className="mt-4 space-y-2">
          {data?.listings.map((l) => (
            <div key={l.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border border-border bg-card p-3">
              <Link to="/annonces/$id" params={{ id: l.id }} className="truncate font-display text-lg uppercase">
                {l.title}
              </Link>
              {l.is_open && (
                <button onClick={() => closeListing(l.id)} className="label-xs shrink-0 border border-border px-3 py-1.5">
                  Fermer
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
