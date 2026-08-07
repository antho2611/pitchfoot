import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageShell } from "@/components/layout/Shell";
import { LEVELS, POSITIONS } from "@/lib/football";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/annonces/")({
  head: () => ({
    meta: [
      { title: "Annonces de recrutement — PitchPro" },
      {
        name: "description",
        content:
          "Toutes les annonces de recrutement des clubs amateurs : poste recherché, niveau, âge et ville.",
      },
      { property: "og:title", content: "Annonces de recrutement — PitchPro" },
      { property: "og:description", content: "Trouvez le club qui cherche votre profil." },
    ],
  }),
  component: ListingsPage,
});

function ListingsPage() {
  const [position, setPosition] = useState("");
  const [level, setLevel] = useState("");
  const [city, setCity] = useState("");

  const { data } = useQuery({
    queryKey: ["listings", position, level, city],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select("*, clubs(name, logo_url, is_verified)")
        .eq("is_open", true)
        .order("created_at", { ascending: false })
        .limit(60);
      if (position) query = query.eq("position", position);
      if (level) query = query.eq("level", level);
      if (city) query = query.ilike("city", `%${city.trim()}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const select = "border border-border bg-card px-3 py-2.5 text-sm outline-none focus:border-pitch";

  return (
    <PageShell>
      <section className="border-b border-pitch/10 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h1 className="font-display text-6xl uppercase">Annonces</h1>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <select
              className={select}
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            >
              <option value="">Tous les postes</option>
              {POSITIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <select className={select} value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Tous niveaux</option>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <input
              className={select}
              placeholder="Ville"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={60}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {data && data.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {data.map((l) => (
              <Link
                key={l.id}
                to="/annonces/$id"
                params={{ id: l.id }}
                className="block border border-pitch/5 bg-card p-6 transition-shadow hover:shadow-lg"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <h2 className="font-display text-3xl uppercase leading-tight">{l.title}</h2>
                  {l.position && (
                    <span className="shrink-0 bg-volt px-2 py-1 text-[10px] font-black uppercase text-pitch">
                      {l.position}
                    </span>
                  )}
                </div>
                <p className="label-xs mt-1 text-foreground/40">
                  {l.clubs?.name ?? "Club"} •{" "}
                  {[l.level, l.city, l.season].filter(Boolean).join(" • ")}
                </p>
                <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                  {l.description || "Pas de description."}
                </p>
                {(l.min_age || l.max_age) && (
                  <p className="label-xs mt-4 text-foreground/40">
                    Âge : {l.min_age ?? "—"} à {l.max_age ?? "—"} ans
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Aucune annonce ouverte pour ces critères.
          </p>
        )}
      </section>
    </PageShell>
  );
}
