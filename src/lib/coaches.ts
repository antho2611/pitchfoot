export const COACH_SPECIALTIES = [
  "Préparation physique de reprise",
  "Prévention des blessures",
  "Remise en forme post-blessure",
  "Renforcement musculaire",
  "Vitesse & explosivité",
  "Endurance & VMA",
  "Mobilité & souplesse",
  "Préparation mentale",
  "Nutrition sportive",
] as const;

export const SESSION_TYPES = [
  { value: "collective", label: "Séance collective" },
  { value: "individuelle", label: "Séance individuelle" },
] as const;

export const SESSION_STATUS = [
  { value: "active", label: "Active" },
  { value: "complete", label: "Complète" },
  { value: "expiree", label: "Expirée" },
] as const;

export const sessionTypeLabel = (v?: string | null) =>
  SESSION_TYPES.find((t) => t.value === v)?.label ?? "Séance";

export const sessionStatusLabel = (v?: string | null) =>
  SESSION_STATUS.find((s) => s.value === v)?.label ?? "Active";

export const RADIUS_OPTIONS = [10, 20, 30, 50, 100] as const;

/** Distance en km entre deux points (formule de haversine). */
export function distanceKm(
  aLat?: number | null,
  aLon?: number | null,
  bLat?: number | null,
  bLon?: number | null,
): number | null {
  if (aLat == null || aLon == null || bLat == null || bLon == null) return null;
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)));
}

export function formatSessionDate(date: string, start?: string | null, end?: string | null) {
  const d = new Date(`${date}T00:00:00`);
  const label = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hours = [start?.slice(0, 5), end?.slice(0, 5)].filter(Boolean).join(" – ");
  return hours ? `${label} · ${hours}` : label;
}
