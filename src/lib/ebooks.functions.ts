import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Renvoie une URL signée temporaire (10 min) vers le PDF d'un ebook,
 * uniquement si l'utilisateur connecté l'a débloqué (achat confirmé ou gratuit).
 */
export const getEbookDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ ebookId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: purchase } = await supabase
      .from("ebook_purchases")
      .select("id")
      .eq("ebook_id", data.ebookId)
      .eq("user_id", userId)
      .eq("status", "paid")
      .maybeSingle();

    if (!purchase) throw new Error("Ce guide n'est pas dans votre bibliothèque.");

    const { data: ebook } = await supabase
      .from("ebooks")
      .select("content_path")
      .eq("id", data.ebookId)
      .maybeSingle();

    const path = ebook?.content_path;
    if (!path) throw new Error("Fichier indisponible.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("ebooks-private")
      .createSignedUrl(path, 600, { download: true });

    if (error || !signed) throw new Error("Lien de téléchargement indisponible.");
    return { url: signed.signedUrl };
  });
