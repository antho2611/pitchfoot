import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/Shell";
import { supabase } from "@/integrations/supabase/client";
import { COACH_SPECIALTIES, RADIUS_OPTIONS, distanceKm } from "@/lib/coaches";
import { CityAutocomplete } from "@/components/CityAutocomplete";

export const Route = createFileRoute("/preparateurs/")({
  head: () => ({
    meta: [
      { title: "Préparateurs physiques — PitchPro" },
      {
        name: "description",
        content:
          "Trouvez un préparateur physique près de chez vous : spécialités, zone d'intervention, tarifs et séances disponibles.",
      },
      { property: "og:title", content: "Préparateurs physiques — PitchPro" },
      {
        property: "og:description",
        content: "Recherchez un préparateur physique par ville, distance et spécialité.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CoachSearch,
});

function CoachSearch() {
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState<number>(30);
  const [specialty, setSpecialty] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [origin, setOrigin] = useState<{ lat: number; lon: number; label: string } | null>(null);

  const { data: coaches, isLoading } = useQuery({
    queryKey: ["preparateurs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("preparateurs")
        .select(
          "id, full_name, headline, bio, qualifications, specialties, price_info, photo_url, city, country, latitude, longitude, radius_km, website, is_premium, is_verified, views_count, created_at, updated_at, coach_annonces(id, status, session_date)",
        )
        .order("is_premium", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const results = useMemo(() => {
    const list = (coaches ?? []).map((c) => {
      const ads = (c.coach_annonces ?? []) as Array<{ status: string; session_date: string }>;
      const activeAds = ads.filter((a) => a.status === "active").length;
      const dist = origin ? distanceKm(origin.lat, origin.lon, c.latitude, c.longitude) : null;
      return { ...c, activeAds, dist };
    });
    return list
      .filter((c) => (specialty ? (c.specialties ?? []).includes(specialty) : true))
      .filter((c) => (onlyActive ? c.activeAds > 0 : true))
      .filter((c) => (origin ? c.dist != null && c.dist <= radius + (c.radius_km ?? 0) : true))
      .sort((a, b) => {
        if (origin && a.dist != null && b.dist != null) return a.dist - b.dist;
        return Number(b.is_premium) - Number(a.is_premium);
      });
  }, [coaches, specialty, onlyActive, origin, radius]);

  const input =
    "w-full border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-pitch";

  return (
    <PageShell>
      <section className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h1 className="font-display text-6xl uppercase leading-[0.9]">
            Préparateurs
            <br />
            <span className="bg-pitch px-2 text-volt">physiques</span>
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Reprise, prévention des blessures, renforcement musculaire : trouvez le professionnel
            qui intervient près de chez vous.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-3 border border-border bg-card p-4 md:grid-cols-4">
          <CityAutocomplete
            value={city}
            onChange={setCity}
            placeholder="Ville (ex : Mandelieu)"
            onSelect={(pick) =>
              setOrigin(pick ? { lat: pick.lat, lon: pick.lon, label: pick.label } : null)
            }
          />
          <select
            className={input}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={r}>
                Moins de {r} km
              </option>
            ))}
          </select>
          <select
            className={input}
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          >
            <option value="">Toutes les spécialités</option>
            {COACH_SPECIALTIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
            />
            Avec séances actives
          </label>
        </div>

        {origin && (
          <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
            Autour de {origin.label.split(",")[0]} — {results.length} préparateur(s)
          </p>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && <p className="text-muted-foreground">Chargement…</p>}
          {!isLoading && results.length === 0 && (
            <p className="text-muted-foreground">Aucun préparateur ne correspond à ces critères.</p>
          )}
          {results.map((c) => (
            <Link
              key={c.id}
              to="/preparateurs/$id"
              params={{ id: c.id }}
              className="group flex flex-col border border-border bg-card p-5 transition-colors hover:border-pitch"
            >
              <div className="flex items-center gap-4">
                <div className="size-14 shrink-0 overflow-hidden border border-border bg-muted">
                  {c.photo_url && (
                    <img
                      src={c.photo_url}
                      alt={`Photo de ${c.full_name}`}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-2xl uppercase leading-none">
                    {c.full_name || "Préparateur"}
                  </p>
                  <p className="mt-1 truncate text-xs uppercase tracking-widest text-muted-foreground">
                    {c.city ?? "Ville non renseignée"}
                    {c.dist != null ? ` · ${c.dist} km` : ""}
                  </p>
                </div>
              </div>
              {c.headline && <p className="mt-4 line-clamp-2 text-sm">{c.headline}</p>}
              <div className="mt-4 flex flex-wrap gap-1">
                {(c.specialties ?? []).slice(0, 3).map((s: string) => (
                  <span key={s} className="bg-muted px-2 py-1 text-[11px] uppercase tracking-wide">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                <span>Rayon {c.radius_km} km</span>
                <span>{c.activeAds} séance(s)</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
