import { createServerFn } from "@tanstack/react-start";

/** Clés d'illustrations autorisées (évite tout accès arbitraire au stockage). */
const ALLOWED_KEYS = ["home_hero"] as const;
export type SiteAssetKey = (typeof ALLOWED_KEYS)[number];

export type SiteAsset = { url: string | null; alt: string | null };

/**
 * Renvoie l'URL signée d'une illustration du site (lecture publique).
 * Le bucket `media` est privé : le lien est régénéré à chaque requête.
 */
export const getSiteAsset = createServerFn({ method: "GET" })
  .inputValidator((input: { key: string }) => {
    if (!ALLOWED_KEYS.includes(input.key as SiteAssetKey)) {
      throw new Error("Illustration inconnue");
    }
    return { key: input.key as SiteAssetKey };
  })
  .handler(async ({ data }): Promise<SiteAsset> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("site_assets")
      .select("storage_path, alt_text")
      .eq("key", data.key)
      .maybeSingle();

    if (!row?.storage_path) return { url: null, alt: row?.alt_text ?? null };

    const { data: signed } = await supabaseAdmin.storage
      .from("media")
      .createSignedUrl(row.storage_path, 60 * 60);

    return { url: signed?.signedUrl ?? null, alt: row.alt_text ?? null };
  });
