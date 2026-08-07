import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { SESSION_TYPES, distanceKm } from "@/lib/coaches";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { SessionCard } from "@/components/SessionCard";

export const Route = createFileRoute("/seances/")({
  head: () => ({
    meta: [
      { title: "Séances de préparation physique — PitchPro" },
      {
        name: "description",
        content:
          "Toutes les séances collectives et individuelles proposées par les préparateurs physiques, triées par date ou par proximité.",
      },
      { property: "og:title", content: "Séances de préparation physique — PitchPro" },
      {
        property: "og:description",
        content: "Trouvez une séance près de chez vous et contactez le préparateur.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const [type, setType] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<"date" | "distance">("date");
  const [origin, setOrigin] = useState<{ lat: number; lon: number; label: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["seances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_annonces")
        .select("*, preparateurs(id, full_name, city, latitude, longitude, photo_url, specialties)")
        .eq("status", "active")
        .gte("session_date", new Date().toISOString().slice(0, 10))
        .order("session_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const rows = useMemo(() => {
    const list = (data ?? []).map((a) => {
      const coach = a.preparateurs as {
        id: string;
        full_name: string;
        city: string | null;
        latitude: number | null;
        longitude: number | null;
        photo_url: string | null;
        specialties?: string[] | null;
      } | null;
      const lat = a.latitude ?? coach?.latitude ?? null;
      const lon = a.longitude ?? coach?.longitude ?? null;
      return {
        ...a,
        coach,
        dist: origin ? distanceKm(origin.lat, origin.lon, lat, lon) : null,
      };
    });
    return list
      .filter((a) => (type ? a.session_type === type : true))
      .sort((a, b) => {
        if (sort === "distance" && a.dist != null && b.dist != null) return a.dist - b.dist;
        return a.session_date.localeCompare(b.session_date);
      });
  }, [data, type, sort, origin]);

  const input =
    "w-full border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-pitch";

  return (
    <PageShell>
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h1 className="font-display text-6xl uppercase leading-[0.9]">
            Séances
            <br />
            <span className="bg-pitch px-2 text-volt">disponibles</span>
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Séances collectives et individuelles publiées par les préparateurs physiques du réseau.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-3 border border-border bg-card p-4 md:grid-cols-3">
          <CityAutocomplete
            value={city}
            onChange={setCity}
            placeholder="Ville de référence"
            onSelect={(pick) => {
              if (!pick) {
                setOrigin(null);
                return;
              }
              setOrigin({ lat: pick.lat, lon: pick.lon, label: pick.label });
              setSort("distance");
            }}
          />
          <select className={input} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Tous les types</option>
            {SESSION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            className={input}
            value={sort}
            onChange={(e) => setSort(e.target.value as "date" | "distance")}
          >
            <option value="date">Trier par date</option>
            <option value="distance">Trier par proximité</option>
          </select>
        </div>

        <div className="mt-8 space-y-3">
          {isLoading && <p className="text-muted-foreground">Chargement…</p>}
          {!isLoading && rows.length === 0 && (
            <p className="text-muted-foreground">Aucune séance active pour le moment.</p>
          )}
          {rows.map((a) => (
            <SessionCard key={a.id} ad={a} coach={a.coach} dist={a.dist} />
          ))}
        </div>
      </section>
    </PageShell>
  );
}
