import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Suppression définitive du compte (RGPD, droit à l'effacement).
 * La ligne auth.users est en ON DELETE CASCADE sur toutes les tables
 * applicatives (profil, joueur/club/préparateur, stats, messages, etc.),
 * donc supprimer l'utilisateur Auth suffit à effacer ses données.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("Suppression impossible pour le moment.");
    return { ok: true };
  });
