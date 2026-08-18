import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Bookmark, Flag, MapPin, MessageSquare, Ruler, Weight } from "lucide-react";
import { PageShell } from "@/components/layout/Shell";
import { ageFrom, availabilityLabel, statFieldsFor } from "@/lib/football";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { openConversation, notify } from "@/lib/messaging";
import { isPermissionError } from "@/lib/follows";
import { FollowButton, FollowCounts } from "@/components/FollowButton";

export const Route = createFileRoute("/joueurs/$id")({
  head: () => ({
    meta: [
      { title: "Profil joueur — PitchPro" },
      { name: "description", content: "Profil sportif complet : poste, statistiques et vidéos." },
      { property: "og:title", content: "Profil joueur — PitchPro" },
      {
        property: "og:description",
        content: "Poste, statistiques, physique et vidéos d'un joueur amateur.",
      },
    ],
  }),
  component: PlayerDetail,
  errorComponent: () => (
    <PageShell>
      <p className="mx-auto max-w-3xl px-6 py-24 text-center">Profil indisponible.</p>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell>
      <p className="mx-auto max-w-3xl px-6 py-24 text-center">Ce joueur n'existe pas.</p>
    </PageShell>
  ),
});

function PlayerDetail() {
  const { id } = Route.useParams();
  const { user, accountType } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["player", id],
    queryFn: async () => {
      const [{ data: player, error }, { data: stats }] = await Promise.all([
        supabase.from("players").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("player_stats")
          .select("*")
          .eq("player_id", id)
          .order("season", { ascending: false }),
      ]);
      if (error) throw error;
      if (!player) throw notFound();
      return { player, stats: stats ?? [] };
    },
  });

  useEffect(() => {
    if (!id || user?.id === id) return;
    void supabase.from("profile_views").insert({ player_id: id, viewer_id: user?.id ?? null });
  }, [id, user?.id]);

  if (isLoading || !data) {
    return (
      <PageShell>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="h-96 animate-pulse bg-secondary" />
        </div>
      </PageShell>
    );
  }

  const { player, stats } = data;
  const age = ageFrom(player.birth_date);
  const latest = stats[0];
  const fields = statFieldsFor(player.main_position);

  async function contact() {
    if (!user) return navigate({ to: "/auth" });
    try {
      const cid = await openConversation(user.id, player.id);
      await notify(player.id, "message", "Nouveau contact", "Un club souhaite vous parler.");
      navigate({ to: "/messages", search: { c: cid } });
    } catch (err) {
      toast.error(
        isPermissionError(err)
          ? "Suivez ce profil pour pouvoir lui écrire."
          : "Impossible d'ouvrir la conversation.",
      );
    }
  }

  async function save() {
    if (!user) return navigate({ to: "/auth" });
    const { error } = await supabase
      .from("saved_players")
      .insert({ club_id: user.id, player_id: player.id });
    toast[error ? "error" : "success"](
      error ? "Déjà enregistré ou action impossible." : "Joueur ajouté à votre short-list.",
    );
  }

  async function report() {
    if (!user) return navigate({ to: "/auth" });
    const reason = window.prompt("Motif du signalement ?");
    if (!reason) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: "player",
      target_id: player.id,
      reason: reason.slice(0, 500),
    });
    toast[error ? "error" : "success"](error ? "Échec du signalement." : "Signalement envoyé.");
  }

  return (
    <PageShell>
      <section className="border-b border-pitch/10 bg-pitch text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[280px_1fr]">
          <div className="h-72 w-full overflow-hidden bg-field md:h-80">
            {player.photo_url ? (
              <img
                src={player.photo_url}
                alt={`${player.first_name} ${player.last_name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center font-display text-7xl text-white/15">
                {player.first_name?.[0]}
                {player.last_name?.[0]}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className="label-xs bg-volt px-2 py-1 text-pitch">
              {availabilityLabel(player.availability)}
            </span>
            <h1 className="mt-4 font-display text-6xl uppercase leading-none">
              {player.first_name} {player.last_name}
            </h1>
            <p className="mt-2 text-white/60">
              {player.main_position ?? "Poste non renseigné"}
              {player.current_club ? ` • ${player.current_club}` : ""}
              {player.level ? ` • ${player.level}` : ""}
            </p>
            <div className="mt-2">
              <FollowCounts userId={player.id} tone="dark" />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 text-white/80 sm:grid-cols-4">
              <Info label="Âge" value={age ? `${age} ans` : "—"} />
              <Info
                label="Taille"
                value={player.height_cm ? `${player.height_cm} cm` : "—"}
                icon={Ruler}
              />
              <Info
                label="Poids"
                value={player.weight_kg ? `${player.weight_kg} kg` : "—"}
                icon={Weight}
              />
              <Info label="Pied fort" value={player.strong_foot ?? "—"} />
              <Info label="Ville" value={player.city ?? "—"} icon={MapPin} />
              <Info label="Nationalité" value={player.nationality ?? "—"} />
              <Info label="Expérience" value={`${player.experience_years} an(s)`} />
              <Info label="Vues" value={String(player.views_count)} />
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <FollowButton targetId={player.id} targetName={`${player.first_name} ${player.last_name}`.trim()} tone="dark" />
              {accountType !== "player" && (
                <>
                  <button
                    onClick={contact}
                    className="inline-flex items-center gap-2 bg-volt px-5 py-2.5 font-display text-lg uppercase text-pitch"
                  >
                    <MessageSquare className="size-4" /> Contacter
                  </button>
                  <button
                    onClick={save}
                    className="inline-flex items-center gap-2 border border-white/25 px-5 py-2.5 font-display text-lg uppercase"
                  >
                    <Bookmark className="size-4" /> Sauvegarder
                  </button>
                </>
              )}
              <button
                onClick={report}
                className="inline-flex items-center gap-2 px-3 py-2.5 text-xs uppercase tracking-wider text-white/40 hover:text-white"
              >
                <Flag className="size-3.5" /> Signaler
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-10">
          <div>
            <h2 className="font-display text-4xl uppercase">Statistiques</h2>
            {latest ? (
              <>
                <p className="label-xs mt-1 text-foreground/40">Saison {latest.season}</p>
                <div className="mt-4 grid grid-cols-2 gap-px bg-border sm:grid-cols-5">
                  {fields.map((f) => (
                    <div key={f.key} className="bg-card p-4 text-center">
                      <p className="label-xs text-foreground/40">{f.label}</p>
                      <p className="font-display text-3xl">
                        {(latest as unknown as Record<string, number>)[f.key] ?? 0}
                      </p>
                    </div>
                  ))}
                </div>
                {stats.length > 1 && (
                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="label-xs border-b border-border text-left text-foreground/40">
                          <th className="py-2">Saison</th>
                          {fields.map((f) => (
                            <th key={f.key} className="py-2">
                              {f.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.map((s) => (
                          <tr key={s.id} className="border-b border-border/60">
                            <td className="py-2 font-medium">{s.season}</td>
                            {fields.map((f) => (
                              <td key={f.key} className="py-2">
                                {(s as unknown as Record<string, number>)[f.key] ?? 0}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Aucune statistique renseignée pour l'instant.
              </p>
            )}
          </div>

          {player.bio && (
            <div>
              <h2 className="font-display text-4xl uppercase">Présentation</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {player.bio}
              </p>
            </div>
          )}

          {player.video_urls.length > 0 && (
            <div>
              <h2 className="font-display text-4xl uppercase">Vidéos</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {player.video_urls.map((v) => (
                  <a
                    key={v}
                    href={v}
                    target="_blank"
                    rel="noreferrer"
                    className="block border border-border bg-card p-4 text-sm underline underline-offset-4"
                  >
                    {v}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="border border-border bg-card p-5">
            <h3 className="font-display text-2xl uppercase">Parcours</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {player.previous_clubs || "Non renseigné"}
            </p>
          </div>
          <div className="border border-border bg-card p-5">
            <h3 className="font-display text-2xl uppercase">Palmarès</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {player.trophies || "Non renseigné"}
            </p>
          </div>
          {player.cv_url && (
            <a
              href={player.cv_url}
              target="_blank"
              rel="noreferrer"
              className="block bg-pitch px-5 py-3 text-center font-display text-lg uppercase text-volt"
            >
              Voir le CV sportif
            </a>
          )}
          <Link to="/joueurs" className="label-xs block underline underline-offset-4">
            ← Retour à la recherche
          </Link>
        </aside>
      </section>
    </PageShell>
  );
}

function Info({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="min-w-0">
      <p className="label-xs flex items-center gap-1 text-white/40">
        {Icon && <Icon className="size-3" />}
        {label}
      </p>
      <p className="truncate font-display text-xl">{value}</p>
    </div>
  );
}
