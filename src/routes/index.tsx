import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";
import heroImage from "@/assets/hero-player.jpg";
import { getSiteAsset } from "@/lib/site-assets.functions";
import { PageShell } from "@/components/layout/Shell";
import { PlayerCard } from "@/components/PlayerCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/tableau-de-bord" });
  },
  head: () => ({
    meta: [
      { title: "PitchPro — Le réseau du recrutement football amateur" },
      {
        name: "description",
        content:
          "Joueurs, créez votre profil sportif. Clubs, publiez vos annonces et recrutez. PitchPro est le réseau du football amateur et semi-professionnel.",
      },
      { property: "og:title", content: "PitchPro — Le réseau du recrutement football amateur" },
      {
        property: "og:description",
        content:
          "Joueurs, créez votre profil sportif. Clubs, publiez vos annonces et recrutez. PitchPro est le réseau du football amateur et semi-professionnel.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: players } = useQuery({
    queryKey: ["featured-players"],
    queryFn: async () => {
      const { data } = await supabase
        .from("players")
        .select("*")
        .order("is_premium", { ascending: false })
        .order("views_count", { ascending: false })
        .limit(4);
      return data ?? [];
    },
  });

  const { data: heroAsset } = useQuery({
    queryKey: ["site-asset", "home_hero"],
    queryFn: () => getSiteAsset({ data: { key: "home_hero" } }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: counts } = useQuery({
    queryKey: ["home-counts"],
    queryFn: async () => {
      const [p, c, l] = await Promise.all([
        supabase.from("players").select("id", { count: "exact", head: true }),
        supabase.from("clubs").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("is_open", true),
      ]);
      return { players: p.count ?? 0, clubs: c.count ?? 0, listings: l.count ?? 0 };
    },
  });

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-pitch/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.6 }}
          >
            <span className="label-xs inline-block bg-volt px-2 py-1 text-pitch">
              Football amateur & semi-pro
            </span>
            <h1 className="mt-5 font-display text-6xl uppercase leading-[0.9] sm:text-7xl lg:text-8xl">
              Le terrain
              <br />
              où les carrières
              <br />
              <span className="bg-pitch px-2 text-volt">décollent</span>
            </h1>
            <p className="mt-6 max-w-lg text-base text-muted-foreground">
              Les joueurs construisent un profil sportif complet — stats, vidéos, disponibilité. Les
              clubs publient leurs besoins et recrutent en direct. Sans intermédiaire.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ role: "player" }}
                className="inline-flex items-center gap-2 bg-pitch px-6 py-3 font-display text-xl uppercase text-volt transition-transform hover:-translate-y-0.5"
              >
                Je suis joueur <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/auth"
                search={{ role: "club" }}
                className="inline-flex items-center gap-2 border-2 border-pitch px-6 py-3 font-display text-xl uppercase transition-transform hover:-translate-y-0.5"
              >
                Je suis un club
              </Link>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-pitch/10 pt-6">
              {[
                { label: "Joueurs", value: counts?.players ?? 0 },
                { label: "Clubs", value: counts?.clubs ?? 0 },
                { label: "Annonces", value: counts?.listings ?? 0 },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="label-xs text-foreground/40">{s.label}</dt>
                  <dd className="font-display text-4xl">{s.value}</dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0, duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <img
              src={heroAsset?.url ?? heroImage}
              alt={
                heroAsset?.alt ??
                "Joueur de football amateur en pleine accélération sur un terrain éclairé"
              }
              width={1408}
              height={1008}
              className="h-[420px] w-full object-cover lg:h-[560px]"
            />
            <div className="absolute -bottom-4 -left-4 hidden bg-volt px-4 py-3 sm:block">
              <p className="label-xs text-pitch/60">Annonces ouvertes</p>
              <p className="font-display text-3xl text-pitch">{counts?.listings ?? 0}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-5xl uppercase">Comment ça marche</h2>
        <div className="mt-10 grid gap-px bg-pitch/10 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: "Créez votre profil",
              text: "Poste, pied fort, taille, statistiques par saison, vidéos et CV sportif.",
            },
            {
              icon: Sparkles,
              title: "Soyez repéré",
              text: "Les clubs filtrent par poste, âge, niveau et ville, puis sauvegardent vos profils.",
            },
            {
              icon: ShieldCheck,
              title: "Échangez en direct",
              text: "Candidatures aux annonces et messagerie temps réel entre joueurs et clubs.",
            },
          ].map((step, i) => (
            <div key={step.title} className="bg-background p-8">
              <span className="font-display text-5xl text-volt">0{i + 1}</span>
              <step.icon className="mt-4 size-6" />
              <h3 className="mt-4 font-display text-2xl uppercase">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Joueurs à la une */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <h2 className="font-display text-5xl uppercase">Joueurs à la une</h2>
          <Link to="/joueurs" className="label-xs shrink-0 underline underline-offset-4">
            Voir tous
          </Link>
        </div>
        {players && players.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {players.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        ) : (
          <p className="mt-8 border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Aucun joueur inscrit pour le moment. Soyez le premier à créer votre profil.
          </p>
        )}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="bg-pitch px-8 py-16 text-center">
          <h2 className="font-display text-5xl uppercase text-white sm:text-6xl">
            Votre prochain club <span className="text-volt">vous cherche</span>
          </h2>
          <Link
            to="/auth"
            className="mt-8 inline-block bg-volt px-8 py-3 font-display text-xl uppercase text-pitch"
          >
            Créer mon compte gratuitement
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
