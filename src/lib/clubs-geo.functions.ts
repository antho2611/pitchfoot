import { createServerFn } from "@tanstack/react-start";

/**
 * Géocode (Nominatim) les clubs qui ont une ville mais pas encore de coordonnées GPS
 * et enregistre latitude/longitude en base pour ne plus recalculer ensuite.
 * Volontairement limité à quelques clubs par appel (politesse envers Nominatim).
 */
export const geocodeMissingClubs = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: clubs } = await supabaseAdmin
    .from("clubs")
    .select("id, city, country")
    .is("latitude", null)
    .not("city", "is", null)
    .limit(5);

  if (!clubs?.length) return { updated: 0 };

  let updated = 0;
  for (const club of clubs) {
    const city = (club.city ?? "").trim();
    if (!city) continue;
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", `${city}, ${club.country || "France"}`);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "PitchPro/1.0 (recrutement football amateur)",
          "Accept-Language": "fr",
        },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as Array<{ lat: string; lon: string }>;
      const hit = json?.[0];
      if (!hit) continue;
      await supabaseAdmin
        .from("clubs")
        .update({ latitude: Number(hit.lat), longitude: Number(hit.lon) })
        .eq("id", club.id);
      updated += 1;
    } catch {
      /* réseau indisponible : on réessaiera au prochain appel */
    }
    await new Promise((r) => setTimeout(r, 1100));
  }

  return { updated };
});
