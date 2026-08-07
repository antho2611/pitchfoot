import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { BadgeCheck, Crosshair, List, Map as MapIcon, Search } from "lucide-react";
import { PageShell } from "@/components/layout/Shell";
import { LEVELS } from "@/lib/football";
import { supabase } from "@/integrations/supabase/client";
import { distanceKm } from "@/lib/coaches";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { geocodeMissingClubs } from "@/lib/clubs-geo.functions";

const ClubsMap = lazy(() => import("@/components/ClubsMap"));

const CLUB_COLUMNS =
  "id, name, logo_url, description, stadium, championship, level, city, country, is_verified, is_premium, latitude, longitude";

const RADII = [5, 10, 20, 30, 50, 75, 100] as const;

export const Route = createFileRoute("/clubs/")({
  head: () => ({
    meta: [
      { title: "Clubs qui recrutent près de chez vous — PitchPro" },
      {
        name: "description",
        content:
          "Recherchez les clubs de football amateur autour d'une ville : carte interactive, rayon de 5 à 100 km et distance calculée en temps réel.",
      },
      { property: "og:title", content: "Recherche géographique de clubs — PitchPro" },
      {
        property: "og:description",
        content: "Trouvez les clubs qui recrutent autour de vous grâce à la carte interactive.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ClubsPage,
});

type Center = { lat: number; lon: number; label: string };

function ClubsPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [city, setCity] = useState("");
  const [radius, setRadius] = useState<number>(50);
  const [center, setCenter] = useState<Center | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileMap, setMobileMap] = useState(false);
  const [movedCenter, setMovedCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Complète en arrière-plan les coordonnées manquantes (géocodage Nominatim, enregistré en base).
  useEffect(() => {
    geocodeMissingClubs().catch(() => undefined);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["clubs", q, level, center?.lat, center?.lon, center ? radius : null],
    queryFn: async () => {
      let query = supabase.from("clubs").select(CLUB_COLUMNS);
      if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
      if (level) query = query.eq("level", level);
      if (center) {
        // Pré-filtrage en base sur une boîte englobante : on ne charge que la zone recherchée.
        const dLat = radius / 111;
        const dLon = radius / (111 * Math.max(Math.cos((center.lat * Math.PI) / 180), 0.01));
        query = query
          .gte("latitude", center.lat - dLat)
          .lte("latitude", center.lat + dLat)
          .gte("longitude", center.lon - dLon)
          .lte("longitude", center.lon + dLon);
      }
      const { data, error } = await query
        .order("is_premium", { ascending: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });

  const results = useMemo(() => {
    const list = (data ?? []).map((c) => ({
      ...c,
      dist: center ? distanceKm(center.lat, center.lon, c.latitude, c.longitude) : null,
    }));
    if (!center) return list;
    return list
      .filter((c) => c.dist != null && c.dist <= radius)
      .sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));
  }, [data, center, radius]);

  const mapClubs = useMemo(
    () => results.filter((c) => c.latitude != null && c.longitude != null),
    [results],
  );

  const showSearchArea =
    !!movedCenter &&
    !!center &&
    (distanceKm(center.lat, center.lon, movedCenter.lat, movedCenter.lon) ?? 0) > 2;

  function useMyPosition() {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoError(null);
        setCity("");
        setCenter({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: "Ma position" });
      },
      () => setGeoError("Autorisation de géolocalisation refusée."),
    );
  }

  function selectClub(id: string) {
    setSelectedId(id);
    document.getElementById(`club-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  const input =
    "w-full border border-border bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-pitch";

  const mapPanel = (
    <div className="relative size-full">
      <ClientOnly fallback={<div className="size-full animate-pulse bg-secondary" />}>
        <Suspense fallback={<div className="size-full animate-pulse bg-secondary" />}>
          <ClubsMap
            clubs={mapClubs}
            center={center}
            radiusKm={radius}
            selectedId={selectedId}
            onSelect={selectClub}
            onViewProfile={(id) => navigate({ to: "/clubs/$id", params: { id } })}
            onMoved={(c) => setMovedCenter(c)}
          />
        </Suspense>
      </ClientOnly>

      {showSearchArea && (
        <button
          type="button"
          onClick={() =>
            movedCenter &&
            setCenter({ lat: movedCenter.lat, lon: movedCenter.lon, label: "Cette zone" })
          }
          className="absolute left-1/2 top-4 z-[500] -translate-x-1/2 bg-pitch px-4 py-2 text-xs font-semibold uppercase tracking-widest text-volt shadow-lg transition-transform hover:scale-105"
        >
          Rechercher dans cette zone
        </button>
      )}
    </div>
  );

  return (
    <PageShell>
      <section className="border-b border-pitch/10 bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-6xl uppercase leading-[0.9]">
            Les clubs
            <br />
            <span className="bg-pitch px-2 text-volt">autour de vous</span>
          </h1>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_180px_200px]">
            <div className="flex items-center gap-2 border border-border bg-card px-3">
              <Search className="size-4 shrink-0 text-foreground/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nom du club"
                className="w-full bg-transparent py-2.5 text-sm outline-none"
                maxLength={80}
              />
            </div>
            <CityAutocomplete
              value={city}
              onChange={setCity}
              placeholder="Ville (ex : Nice)"
              onSelect={(pick) =>
                setCenter(pick ? { lat: pick.lat, lon: pick.lon, label: pick.city } : null)
              }
            />
            <select
              className={input}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              aria-label="Rayon de recherche"
            >
              {RADII.map((r) => (
                <option key={r} value={r}>
                  Rayon {r} km
                </option>
              ))}
            </select>
            <select
              className={input}
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              aria-label="Niveau"
            >
              <option value="">Tous niveaux</option>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={useMyPosition}
              className="flex items-center gap-2 border border-pitch px-3 py-2 text-xs font-semibold uppercase tracking-widest transition-colors hover:bg-pitch hover:text-volt"
            >
              <Crosshair className="size-4" /> Utiliser ma position
            </button>
            {center && (
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                Autour de {center.label} — {results.length} club(s) à moins de {radius} km
              </span>
            )}
            {geoError && <span className="text-xs text-destructive">{geoError}</span>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* Carte — visible sur desktop, plein écran sur mobile */}
          <div className="hidden h-[70vh] overflow-hidden border border-border lg:block lg:sticky lg:top-24">
            {mapPanel}
          </div>

          {/* Liste */}
          <div ref={listRef} className="space-y-4">
            {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
            {!isLoading && results.length === 0 && (
              <p className="border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                Aucun club dans cette zone. Élargissez le rayon ou changez de ville.
              </p>
            )}
            {results.map((club) => (
              <div
                key={club.id}
                id={`club-${club.id}`}
                role="button"
                tabIndex={0}
                onClick={() => selectClub(club.id)}
                onKeyDown={(e) => e.key === "Enter" && selectClub(club.id)}
                className={`flex cursor-pointer gap-4 border bg-card p-5 transition-all hover:shadow-lg ${
                  selectedId === club.id
                    ? "border-pitch shadow-lg ring-1 ring-pitch"
                    : "border-pitch/10"
                }`}
              >
                <div className="grid size-16 shrink-0 place-items-center bg-secondary">
                  {club.logo_url ? (
                    <img
                      src={club.logo_url}
                      alt={club.name}
                      loading="lazy"
                      className="size-16 object-cover"
                    />
                  ) : (
                    <span className="font-display text-2xl text-pitch/30">{club.name[0]}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="flex items-center gap-1 truncate font-display text-2xl uppercase">
                    {club.name}
                    {club.is_verified && <BadgeCheck className="size-4 shrink-0 text-volt" />}
                  </h3>
                  <p className="label-xs text-foreground/40">
                    {[club.level, club.city].filter(Boolean).join(" • ") || "Niveau non renseigné"}
                    {club.dist != null ? ` • ${club.dist} km` : ""}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {club.description || "Pas encore de présentation."}
                  </p>
                  <Link
                    to="/clubs/$id"
                    params={{ id: club.id }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 inline-block text-xs font-semibold uppercase tracking-widest underline underline-offset-4"
                  >
                    Voir le profil
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile : bascule liste / carte plein écran */}
      <button
        type="button"
        onClick={() => setMobileMap((v) => !v)}
        className="fixed bottom-6 left-1/2 z-[600] flex -translate-x-1/2 items-center gap-2 bg-pitch px-5 py-3 text-xs font-semibold uppercase tracking-widest text-volt shadow-xl lg:hidden"
      >
        {mobileMap ? <List className="size-4" /> : <MapIcon className="size-4" />}
        {mobileMap ? "Voir la liste" : "Voir la carte"}
      </button>
      {mobileMap && <div className="fixed inset-0 z-[550] bg-background lg:hidden">{mapPanel}</div>}
    </PageShell>
  );
}
