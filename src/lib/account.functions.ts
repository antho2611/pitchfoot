import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Suppression définitive du compte (RGPD, droit à l'effacement).
 * La ligne auth.users est en ON DELETE CASCADE sur toutes les tables
 * applicatives (profil, joueur/club/préparateur, stats, messages, etc.),
 * donc supprimer l'utilisateur Auth suffit à effacer les lignes en base.
 *
 * Le stockage (bucket "media") n'est PAS lié par une contrainte de clé
 * étrangère — sans ce nettoyage explicite, les photos/CV/vidéos de
 * l'utilisateur restaient indéfiniment dans le bucket après suppression du
 * compte, malgré la promesse faite en page profil et dans la politique de
 * confidentialité que "tous vos fichiers seront effacés".
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    for (const folder of ["photo", "cv", "video"]) {
      const { data: files } = await supabaseAdmin.storage
        .from("media")
        .list(`${context.userId}/${folder}`);
      if (files?.length) {
        await supabaseAdmin.storage
          .from("media")
          .remove(files.map((f) => `${context.userId}/${folder}/${f.name}`));
      }
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error("Suppression impossible pour le moment.");
    return { ok: true };
  });
