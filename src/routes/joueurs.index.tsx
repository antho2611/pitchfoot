import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Lock, Search } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/layout/Shell";
import { PlayerCard } from "@/components/PlayerCard";
import { AVAILABILITY, LEVELS, POSITIONS } from "@/lib/football";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  FREE_SEARCH_QUOTA,
  downloadCsv,
  registerSearch,
  toCsv,
  useSearchUsage,
  useSubscription,
} from "@/lib/premium";

export const Route = createFileRoute("/joueurs/")({
  head: () => ({
    meta: [
      { title: "Rechercher des joueurs — PitchPro" },
      {
        name: "description",
        content:
          "Filtrez les joueurs par poste, âge, niveau, ville et disponibilité pour trouver la recrue idéale.",
      },
      { property: "og:title", content: "Rechercher des joueurs — PitchPro" },
      {
        property: "og:description",
        content: "Base de joueurs amateurs et semi-pros filtrable en temps réel.",
      },
    ],
  }),
  component: PlayersPage,
});

type Filters = {
  q: string;
  position: string;
  level: string;
  city: string;
  availability: string;
  maxAge: string;
  foot: string;
  minHeight: string;
  minExperience: string;
};

const EMPTY: Filters = {
  q: "",
  position: "",
  level: "",
  city: "",
  availability: "",
  maxAge: "",
  foot: "",
  minHeight: "",
  minExperience: "",
};

function PlayersPage() {
  const { user, accountType } = useAuth();
  const { isPremium } = useSubscription();
  const usage = useSearchUsage();

  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);

  const isClub = accountType === "club";
  const quotaUsed = usage.data ?? 0;
  const quotaLeft = Math.max(0, FREE_SEARCH_QUOTA - quotaUsed);
  const quotaBlocked = !!user && isClub && !isPremium && quotaLeft === 0;

  const { data, isLoading } = useQuery({
    queryKey: ["players", applied],
    queryFn: async () => {
      let query = supabase
        .from("players")
        .select("*")
        .order("is_premium", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(60);

      if (applied.q.trim()) {
        const term = `%${applied.q.trim()}%`;
        query = query.or(
          `first_name.ilike.${term},last_name.ilike.${term},current_club.ilike.${term}`,
        );
      }
      if (applied.position) query = query.eq("main_position", applied.position);
      if (applied.level) query = query.eq("level", applied.level);
      if (applied.city) query = query.ilike("city", `%${applied.city.trim()}%`);
      if (applied.availability)
        query = query.eq("availability", applied.availability as "recherche_club" | "immediate");
      if (applied.maxAge) {
        const min = new Date();
        min.setFullYear(min.getFullYear() - Number(applied.maxAge));
        query = query.gte("birth_date", min.toISOString().slice(0, 10));
      }
      if (isPremium) {
        if (applied.foot) query = query.eq("strong_foot", applied.foot);
        if (applied.minHeight) query = query.gte("height_cm", Number(applied.minHeight));
        if (applied.minExperience)
          query = query.gte("experience_years", Number(applied.minExperience));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  async function runSearch() {
    if (user && isClub && !isPremium) {
      if (quotaLeft === 0) {
        toast.error("Quota de recherches atteint pour ce mois. Passez en Premium Club.");
        return;
      }
      try {
        await registerSearch();
        await usage.refetch();
      } catch {
        /* le quota ne doit jamais bloquer l'affichage */
      }
    }
    setApplied(draft);
  }

  function exportCsv() {
    if (!isPremium) {
      toast.error("L'export des profils est réservé aux abonnés Premium.");
      return;
    }
    if (!data || data.length === 0) return;
    const rows = data.map((p) => ({
      prenom: p.first_name,
      nom: p.last_name,
      poste: p.main_position,
      niveau: p.level,
      ville: p.city,
      club_actuel: p.current_club,
      pied_fort: p.strong_foot,
      taille_cm: p.height_cm,
      experience_ans: p.experience_years,
      disponibilite: p.availability,
      profil: `${window.location.origin}/joueurs/${p.id}`,
    }));
    downloadCsv(`pitchpro-joueurs-${Date.now()}.csv`, toCsv(rows));
  }

  const select =
    "border border-border bg-card px-3 py-2 text-sm outline-none focus:border-pitch min-w-0";
  const set = (patch: Partial<Filters>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <PageShell>
      <section className="border-b border-pitch/10 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h1 className="font-display text-6xl uppercase">Rechercher un joueur</h1>
          <div className="mt-6 flex items-center gap-2 border border-border bg-card px-3">
            <Search className="size-4 shrink-0 text-foreground/40" />
            <input
              value={draft.q}
              onChange={(e) => set({ q: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && void runSearch()}
              placeholder="Nom, prénom ou club actuel"
              className="w-full bg-transparent py-3 text-sm outline-none"
              maxLength={80}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
            <select
              className={select}
              value={draft.position}
              onChange={(e) => set({ position: e.target.value })}
            >
              <option value="">Tous les postes</option>
              {POSITIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select
              className={select}
              value={draft.level}
              onChange={(e) => set({ level: e.target.value })}
            >
              <option value="">Tous niveaux</option>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <input
              className={select}
              placeholder="Ville"
              value={draft.city}
              onChange={(e) => set({ city: e.target.value })}
              maxLength={60}
            />
            <select
              className={select}
              value={draft.availability}
              onChange={(e) => set({ availability: e.target.value })}
            >
              <option value="">Disponibilité</option>
              {AVAILABILITY.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <select
              className={select}
              value={draft.maxAge}
              onChange={(e) => set({ maxAge: e.target.value })}
            >
              <option value="">Âge max</option>
              {[18, 21, 23, 25, 30, 35].map((a) => (
                <option key={a} value={a}>
                  {a} ans max
                </option>
              ))}
            </select>
          </div>

          {/* Filtres avancés — Premium */}
          <div className="relative mt-3">
            <div className="mb-2 flex items-center gap-2">
              <p className="label-xs text-foreground/40">Filtres avancés</p>
              {!isPremium && (
                <span className="flex items-center gap-1 bg-pitch px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-volt">
                  <Lock className="size-3" /> Premium
                </span>
              )}
            </div>
            <div
              className={`grid grid-cols-2 gap-3 md:grid-cols-3 ${
                isPremium ? "" : "pointer-events-none opacity-40"
              }`}
            >
              <select
                className={select}
                value={draft.foot}
                onChange={(e) => set({ foot: e.target.value })}
                disabled={!isPremium}
              >
                <option value="">Pied fort</option>
                {["Droit", "Gauche", "Ambidextre"].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              <select
                className={select}
                value={draft.minHeight}
                onChange={(e) => set({ minHeight: e.target.value })}
                disabled={!isPremium}
              >
                <option value="">Taille min.</option>
                {[165, 170, 175, 180, 185, 190].map((h) => (
                  <option key={h} value={h}>
                    {h} cm et +
                  </option>
                ))}
              </select>
              <select
                className={select}
                value={draft.minExperience}
                onChange={(e) => set({ minExperience: e.target.value })}
                disabled={!isPremium}
              >
                <option value="">Expérience min.</option>
                {[2, 5, 8, 10].map((y) => (
                  <option key={y} value={y}>
                    {y} ans et +
                  </option>
                ))}
              </select>
            </div>
            {!isPremium && (
              <p className="mt-2 text-xs text-muted-foreground">
                <Link to="/premium" className="font-bold underline">
                  Passez en Premium
                </Link>{" "}
                pour filtrer par pied fort, taille et expérience.
              </p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => void runSearch()}
              disabled={quotaBlocked}
              className="bg-pitch px-6 py-2.5 font-display text-xl uppercase text-volt disabled:opacity-40"
            >
              Rechercher
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 border-2 border-pitch px-4 py-2.5 font-display text-lg uppercase"
            >
              {!isPremium && <Lock className="size-4" />}
              <Download className="size-4" /> Export CSV
            </button>
            {user && isClub && !isPremium && (
              <span className="text-xs uppercase tracking-widest text-foreground/50">
                {quotaLeft}/{FREE_SEARCH_QUOTA} recherches restantes ce mois —{" "}
                <Link to="/premium" className="font-bold underline">
                  illimité en Premium
                </Link>
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-96 animate-pulse bg-secondary" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <>
            <p className="label-xs mb-5 text-foreground/40">{data.length} joueur(s) trouvé(s)</p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.map((p) => (
                <PlayerCard key={p.id} player={p} />
              ))}
            </div>
          </>
        ) : (
          <p className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Aucun joueur ne correspond à ces critères.
          </p>
        )}
      </section>
    </PageShell>
  );
}
