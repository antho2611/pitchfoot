import { createServerFn } from "@tanstack/react-start";

export type GeoPoint = { lat: number; lon: number; label: string } | null;

/** Géocodage d'une ville via Nominatim (OpenStreetMap). */
export const geocodeCity = createServerFn({ method: "GET" })
  .inputValidator((data: { city: string; country?: string }) => ({
    city: String(data.city ?? "").trim().slice(0, 120),
    country: String(data.country ?? "France").trim().slice(0, 60),
  }))
  .handler(async ({ data }): Promise<GeoPoint> => {
    if (!data.city) return null;
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", `${data.city}, ${data.country || "France"}`);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "PitchPro/1.0 (recrutement football amateur)",
          "Accept-Language": "fr",
        },
      });
      if (!res.ok) return null;
      const json = (await res.json()) as Array<{
        lat: string;
        lon: string;
        display_name: string;
      }>;
      const hit = json?.[0];
      if (!hit) return null;
      return { lat: Number(hit.lat), lon: Number(hit.lon), label: hit.display_name };
    } catch {
      return null;
    }
  });
